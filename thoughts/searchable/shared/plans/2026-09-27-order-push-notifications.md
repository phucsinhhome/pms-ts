---
title: 2026-09-27-order-push-notifications
type: plan
date: 2026-09-27
status: draft
project: pms-ts
scope: shared
author: Minh Trần
ticket: null
tags: [notifications, firebase, orders, pwa]
related: []
---

# Order Push Notifications (FCM) Implementation Plan

## Overview

Alert staff in their web browser the moment a guest places a new order, even when the PMS tab is
inactive or closed. The frontend (`pms-ts`) registers each browser with Firebase Cloud Messaging (FCM)
and hands its registration token to the backend (`vom-assistant`). When a guest's order is committed,
the backend — and only the backend, using a service-account credential — sends a web push to every
registered device of every staff member of that order's organization. Telegram notifications stay
exactly as they are.

## Current State Analysis

- **Order commit** — guests commit orders anonymously through `POST /{tenant}/cater/order/commit`
  (`vom-assistant/src/main/java/vn/gofarmstay/controller/CaterAPI.java:66`), which calls
  `OrderServiceImpl.commitOrder(tenantId, requestOrder)`
  (`vom-assistant/src/main/java/vn/gofarmstay/service/impl/OrderServiceImpl.java:153`). It moves the order
  from `orderSessionStore` to `orderStore` with status `SENT` (`:180-183`) and then notifies Telegram
  chats inside a `try/catch` (`:185-219`).
- **No push infrastructure** — the backend has no Firebase dependency, no `@EnableAsync`, and no
  application events (`AssistanttApplication.java:11-13` only enables scheduling).
- **Persistence pattern** — domain data lives in Infinispan replicated caches persisted to RocksDB, e.g.
  the `users` cache: store `UserInfoInfinispanCache` (`repository/imdg/impl/UserInfoInfinispanCache.java`)
  on top of `AbstractIMDGStore`, protostream adapter `UserAdapter` (`config/protoadapter/UserAdapter.java`)
  registered in `CacheSerializationContextInitializer` (`config/cache/CacheSerializationContextInitializer.java:7-37`).
- **Two `infinispan.xml` copies** — the image ships `vom-assistant/src/main/resources/infinispan.xml`
  (RocksDB schema `15.0`), but production mounts
  `devops/docker-swarm/config/assistant/infinispan.xml` (schema `14.0`, 60-day lifespans
  `5184000000`), per `devops/docker-swarm/stack/ps.yml` volumes and `infinispan.embedded.configXml:
  ./config/infinispan.xml` in `src/main/resources/config/application-hcm.yml`.
- **Security** — authenticated-only paths are listed in
  `SecurityConfiguration.java:199` (`"/", "/profile/**", ...`); anything not matched there or by the
  enforcer paths in `application-security.yml` hits `anyRequest().denyAll()` (`:215`). The CORS origin
  whitelist (`spring.security.cors.allowed-origins`) is already used to validate redirect targets via
  the private `isAllowedRedirectOrigin` (`SecurityConfiguration.java:71`).
- **Organization data** — `ProfileController.organizationsOf` (`controller/ProfileController.java`)
  builds `[{alias, name}]` from the `organization` + `organization_info` claims. The anonymous guest
  commit has no such claims, so organization names must be captured when staff register a device.
- **Property prefix** — `notification:` is already used by the Telegram module
  (`application-notify.yml`), so the new settings use `push-notification:`.
- **Frontend** — `firebase@11.9.1` is installed (with `firebase/messaging`) and `firebaseConfig` for
  project `splendid-sonar-174914` exists but is unused (`pms-ts/src/db/configs.ts:154`). The order page
  route is `order/:orderId/:staffId` (`src/App.tsx`, `OrderEditor.tsx:34`). `OrderManager` loads via
  `fetchOrders` (`src/Components/OrderManager.tsx:81`). The current organization is resolved by
  `resolveTenant` (`src/db/tenant.ts:36`) inside `fetchUserProfile` (`src/App.tsx:246`).
- **Tests** — backend: JUnit 5 + Mockito unit tests without Spring context (e.g.
  `service/impl/BookingServiceImplOptimisticLockingTest.java`) and adapter round-trip tests
  (`config/protoadapter/InvoiceAdapterTaxCompatibilityTest.java`). Frontend: Jest is currently broken by
  `.babelrc` referencing an uninstalled plugin, so frontend verification is `tsc`, ESLint and a
  `CI=true` build.

## Desired End State

1. A staff member turns on **Order alerts** on the Profile page; the browser asks for notification
   permission; the device is registered for all organizations the staff member belongs to.
2. When a guest commits an order in organization `org2`, every device registered by a member of `org2`
   shows a system notification titled **"Org Two · New order"** with body **"4 items"** (plus
   `· <group>` when the order has a group), even with the tab/browser closed (Chrome on Android).
3. Tapping it opens `<registering site>/order/<orderId>/<username>?tenant=org2`; the app switches to
   `org2` before showing the order.
4. With the app open, an in-app toast appears instead and the Order page refreshes its list.
5. Telegram notifications are unchanged. A push failure never affects the order commit.
6. Signing out unregisters the device; stale tokens disappear after 60 days without refresh or as soon
   as FCM reports them unregistered.

Verification: the end-to-end steps in **Testing Strategy → Manual Testing Steps**.

### Key Discoveries:
- Single hook point for new orders: `OrderServiceImpl.commitOrder` after `orderStore.put` (`OrderServiceImpl.java:182`).
- Nested protostream types follow `UserInfo.UserAttribute` + `UserAttributeAdapter`.
- Production reads the **devops** `infinispan.xml`; both copies need the new cache.
- `/*/cater/**` is `permitAll` (`SecurityConfiguration.java:187`) — the commit request carries no staff identity.
- Web-push links must point at the origin the device registered from (`pmsdr-ps` vs `pmsts-ps` are separate sites).

## What We're NOT Doing

- Notifications for order updates, confirmations, cancellations or any non-order events.
- Per-staff or per-role recipient filtering (all members of the organization receive alerts).
- Changing or removing Telegram notifications.
- iOS support beyond what Safari offers for home-screen web apps; no native apps.
- Notification preferences beyond a single on/off switch per device.
- Fixing the frontend Jest setup.

## Implementation Approach

Build bottom-up so each phase is independently deployable and harmless when the next one is missing:
storage + registration endpoint first (devices can register, nothing is sent), then sending (guarded by
a `push-notification.enabled` flag and the presence of credentials), then the frontend, then the
production configuration. Push sending runs asynchronously on a dedicated executor, triggered by a
Spring application event published after the order is stored, so it can never block or fail a commit.

---

## Phase 1: Backend — Device Registration Storage & Endpoint

### Overview
Persist one `DeviceRegistration` per FCM token in a new `notification-devices` cache and expose
`POST/DELETE /notification/devices` for logged-in staff.

### Changes Required:

#### 1. Model
**File**: `vom-assistant/src/main/java/vn/gofarmstay/model/DeviceRegistration.java` (new)
**Changes**: Lombok `@Getter @Setter @Builder` class, not extending `IdentifiedEntry` (keyed by token).

```java
public class DeviceRegistration {
    private String token;          // FCM registration token, cache key
    private String username;       // preferred_username of the staff member
    private String kcId;           // OIDC subject
    private Set<OrganizationRef> organizations; // memberships captured at registration
    private String origin;         // site the device registered from, e.g. https://pmsdr-ps.netlify.app
    private String userAgent;
    private LocalDateTime registeredAt;
    private LocalDateTime lastSeenAt;

    @Getter @Setter @Builder
    public static class OrganizationRef {
        private String alias;
        private String name;
    }
}
```

#### 2. Protostream adapters
**Files** (new): `config/protoadapter/DeviceRegistrationAdapter.java`,
`config/protoadapter/OrganizationRefAdapter.java`
**Changes**: follow `UserAdapter` / `UserAttributeAdapter`: `@ProtoAdapter`, `@ProtoFactory` with all
fields, numbered `@ProtoField` getters; `organizations` uses
`@ProtoField(number = 4, collectionImplementation = HashSet.class)`; `LocalDateTime` fields rely on the
existing `LocalDateTimeAdapter`.

**File**: `config/cache/CacheSerializationContextInitializer.java`
**Changes**: add `DeviceRegistrationAdapter.class` and `OrganizationRefAdapter.class` to `includeClasses`.

#### 3. Store
**File**: `repository/imdg/NotificationDeviceStore.java` (new)

```java
public interface NotificationDeviceStore extends Cache<String, DeviceRegistration> {
    List<DeviceRegistration> findByOrganization(String alias);
}
```

**File**: `repository/imdg/impl/NotificationDeviceInfinispanCache.java` (new)
**Changes**: `@Component`, extends `AbstractIMDGStore<String, DeviceRegistration>`,
`defaultCacheName()` returns `"notification-devices"`, empty `registerListener()`.
`findByOrganization` streams `cache.values()` and keeps registrations whose `organizations` contain the
alias. (Device counts are tens, so no index is needed; `max-count` is raised to keep them all in memory.)

#### 4. Cache definition (image copy)
**File**: `vom-assistant/src/main/resources/infinispan.xml`
**Changes**: add after the `users` cache, matching this file's `15.0` store namespace:

```xml
<replicated-cache name="notification-devices" mode="SYNC" statistics="true">
    <encoding media-type="application/x-protostream"/>
    <expiration lifespan="5184000000"/>
    <memory when-full="REMOVE" max-count="500"/>
    <persistence passivation="false">
        <rocksdb-store xmlns="urn:infinispan:config:store:rocksdb:15.0" path="rocksdb">
            <expiration path="expired"/>
        </rocksdb-store>
    </persistence>
</replicated-cache>
```

(`lifespan` 60 days; every re-registration `put` restarts it.)

#### 5. Shared claim/origin helpers
**File**: `service/supporter/OrganizationClaims.java` (new)
**Changes**: move the body of `ProfileController.organizationsOf` + `firstValue` into
`public static List<Map<String, String>> organizationsOf(OidcUser)`; `ProfileController` calls it
(behaviour unchanged).

**File**: `config/SecurityConfiguration.java`
**Changes**: make `isAllowedRedirectOrigin(String, List<String>)` `public static` so the controller can
validate origins; add `"/notification/**"` to the authenticated matcher at `:199`.

#### 6. Controller
**File**: `controller/NotificationDeviceController.java` (new)
**Changes**: `@RestController @RequestMapping("notification/devices")`, injected
`NotificationDeviceStore` and `@Value("${spring.security.cors.allowed-origins}") List<String>`.

- `POST` body `{ "token": "..." }`, principal `@AuthenticationPrincipal OidcUser`:
  - `400` if token blank; `401` if principal null.
  - origin = request header `Origin`; `400` unless `SecurityConfiguration.isAllowedRedirectOrigin(origin, allowedOrigins)`.
  - organizations from `OrganizationClaims.organizationsOf(oidcUser)` (never from the request body).
  - if the token exists under a different `username`, overwrite (device changed hands); keep `registeredAt` when same user.
  - `put(token, registration)` with `lastSeenAt = now`; respond `204`.
- `DELETE` body `{ "token": "..." }`: remove only if the stored `username` matches the caller; `204` either way.

#### 7. Tests
**Files** (new, `src/test/java/vn/gofarmstay/...`):
- `config/protoadapter/DeviceRegistrationAdapterTest.java` — round-trip a registration with two
  organizations through the generated schema (pattern of `InvoiceAdapterTaxCompatibilityTest`).
- `controller/NotificationDeviceControllerTest.java` — Mockito unit tests: rejects blank token, rejects
  non-whitelisted origin, stores organizations from claims (ignores any body fields), DELETE of another
  user's token is a no-op.

### Success Criteria:

#### Automated Verification:
- [ ] Backend compiles: `mvn -q -o compile -DskipTests` (in `vom-assistant`)
- [ ] New tests pass: `mvn -q test -Dtest='DeviceRegistrationAdapterTest,NotificationDeviceControllerTest'`
- [ ] Existing adapter/profile behaviour intact: `mvn -q test -Dtest='InvoiceAdapterTaxCompatibilityTest'`

#### Manual Verification:
- [ ] Backend starts locally and logs no Infinispan error for `notification-devices`.
- [ ] Logged-in `curl`/browser `POST /assistant/notification/devices` with a dummy token returns `204`;
      the same call without a session returns `401`/login redirect.
- [ ] After a backend restart, the registration is still present (persistence works).
- [ ] `/assistant/profile` still returns `organizations` unchanged.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Backend — Sending Pushes on New Orders

### Overview
Publish an `OrderCommittedEvent` from `commitOrder`, and send one FCM web push per matching device from
an async listener using the Firebase Admin SDK.

### Changes Required:

#### 1. Dependency
**File**: `vom-assistant/pom.xml`
**Changes**: add `com.google.firebase:firebase-admin`, pinned to the current 9.x release on Maven Central
at implementation time. Run `mvn dependency:tree -Dincludes=com.google.*` and resolve any Guava /
google-http-client conflicts with the existing Google API dependencies by aligning versions (not by
excluding the Admin SDK's transitive deps).

#### 2. Properties
**File**: `vom-assistant/src/main/resources/application-push.yml` (new)

```yaml
push-notification:
  enabled: ${PUSH_NOTIFICATION_ENABLED:false}
  credentials-file: ${FIREBASE_CREDENTIALS_FILE:/run/secrets/firebase_service_account}
  default-web-app: ${PMS_WEB_APP:http://localhost:3000}
```

**File**: `vom-assistant/src/main/resources/application.yml`
**Changes**: append `push` to `spring.profiles.include`.

**File**: `properties/PushNotificationProperties.java` (new) — `enabled`, `credentialsFile`,
`defaultWebApp`; bound in the new configuration below with `@ConfigurationProperties(prefix = "push-notification")`.

#### 3. Firebase + async configuration
**File**: `config/PushNotificationConfiguration.java` (new)
**Changes**:
- `@Configuration @EnableAsync`.
- `@Bean PushNotificationProperties`.
- `@Bean(name = "notificationExecutor") ThreadPoolTaskExecutor` (core 1, max 2, queue 100, thread prefix `push-`).
**File**: `service/impl/PushSender.java` (new)
**Changes**: `@Component` owning the Firebase client. In `@PostConstruct`, when `enabled=true`: load
  `GoogleCredentials.fromStream(new FileInputStream(credentialsFile))`, `FirebaseApp.initializeApp(options, "pms-push")`,
  keep `FirebaseMessaging.getInstance(app)`. If disabled, or the key file is missing/unreadable, log
  (`ERROR` when enabled but broken) and stay disabled — **startup is never blocked**. Exposes
  `isEnabled()` and `sendEach(List<Message>)` so the notifier can be unit-tested with a mocked `PushSender`.

#### 4. Event
**File**: `event/OrderCommittedEvent.java` (new) — `public record OrderCommittedEvent(Order order) {}`.

**File**: `service/impl/OrderServiceImpl.java`
**Changes**: inject `ApplicationEventPublisher`; right after `orderSessionStore.remove(orderId);`
(`:183`) and before the Telegram block:

```java
try {
    eventPublisher.publishEvent(new OrderCommittedEvent(existingOrder));
} catch (Exception e) {
    log.error("Failed to publish order committed event {}", existingOrder.getId(), e);
}
```

(`@EventListener` + `@Async` means `publishEvent` only enqueues; the try/catch guards the enqueue.)

#### 5. Listener / sender
**File**: `service/impl/OrderPushNotifier.java` (new)
**Changes**: `@Component`, injects `NotificationDeviceStore`, `PushNotificationProperties`,
`PushSender`.

```java
@Async("notificationExecutor")
@EventListener
public void onOrderCommitted(OrderCommittedEvent event) { ... }
```

- Return immediately if `!pushSender.isEnabled()` (feature disabled or misconfigured).
- `devices = store.findByOrganization(order.getTenantId())`; return if empty.
- Per device build a `Message`:
  - title `"<orgName> · New order"` where `orgName` = the device's `OrganizationRef.name` for the alias (fallback alias);
  - body `"<n> items"` where `n` = sum of item quantities, plus `" · " + group` when `order.getGroup()` is set;
  - `WebpushNotification`: `tag = "order-" + orderId`, `icon = "/logo192.png"`, `renotify = true`;
  - `WebpushFcmOptions.withLink(origin + "/order/" + orderId + "/" + username + "?tenant=" + alias)`
    (`origin` = device origin, fallback `defaultWebApp`; URL-encode path segments);
  - data: `type=order_committed`, `orderId`, `tenant`.
  - No guest name in the payload (lock-screen privacy).
- Send with `pushSender.sendEach(messages)` (wrapping `FirebaseMessaging.sendEach`) in chunks of 500.
- For each failed response whose `MessagingErrorCode` is `UNREGISTERED` or `INVALID_ARGUMENT`,
  remove that token from the store; log other failures with the token suffix only.
- Catch all exceptions; log `"Pushed order {} to {}/{} devices"`.

#### 6. Tests
**File**: `src/test/java/vn/gofarmstay/service/impl/OrderPushNotifierTest.java` (new) — Mockito with a
mocked `PushSender`/`BatchResponse`:
- sends only to devices of the order's organization; title uses that device's organization name;
- link uses the device origin and `?tenant=`; body sums quantities and appends group;
- removes the token on `UNREGISTERED`; keeps it on `INTERNAL`;
- no-op when `pushSender.isEnabled()` is false.

**File**: `src/test/java/vn/gofarmstay/service/impl/OrderServiceImplCommitEventTest.java` (new) —
`commitOrder` publishes `OrderCommittedEvent` once, and still returns the order when the publisher throws.

### Success Criteria:

#### Automated Verification:
- [ ] Backend compiles: `mvn -q -o compile -DskipTests` (first run online for the new dependency: `mvn -q compile -DskipTests`)
- [ ] New tests pass: `mvn -q test -Dtest='OrderPushNotifierTest,OrderServiceImplCommitEventTest'`
- [ ] Phase 1 tests still pass: `mvn -q test -Dtest='DeviceRegistrationAdapterTest,NotificationDeviceControllerTest'`
- [ ] No Guava/HTTP client conflicts: `mvn -q dependency:tree -Dverbose -Dincludes=com.google.guava` shows a single resolved Guava version

#### Manual Verification:
- [ ] With `PUSH_NOTIFICATION_ENABLED=false` (default) the backend starts and orders commit normally.
- [ ] With it `true` and a valid key file, the backend starts and logs Firebase initialisation.
- [ ] With it `true` but no key file, the backend still starts, logs an ERROR, and orders commit normally.
- [ ] Committing a test order with no registered devices logs nothing alarming and Telegram still fires.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Frontend — Registration, Service Worker, In-App Handling

### Overview
Let staff opt in per device, keep the registration fresh, show notifications when the tab is closed,
and react in-app when it is open.

### Changes Required:

#### 1. Service worker
**File**: `pms-ts/public/firebase-messaging-sw.js` (new)
**Changes**: `importScripts` of `https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js` and
`firebase-messaging-compat.js` (same version as the npm package); `firebase.initializeApp({...})` with the
same public values as `firebaseConfig` in `src/db/configs.ts:154` (comment that both must change
together); `firebase.messaging()`. Notification payloads with `fcm_options.link` are displayed and
opened by the SDK itself, so no custom `push`/`notificationclick` handlers are needed.
(Netlify serves existing static files before the `/* /index.html 200` rule in `public/_redirects`.)

#### 2. Registration module
**File**: `pms-ts/src/db/notification.ts` (new)
**Changes**:
- Add `const notificationApi = createApiInstance(process.env.REACT_APP_PS_BASE_URL)` to `src/db/apis.ts`
  and export it (no `{tenant}` placeholder, like `psBaseApi`); `notification.ts` calls `/notification/devices` on it.
- `ORDER_ALERTS_KEY = 'pms.orderAlerts'` in `localStorage` (try/catch like `tenant.ts`).
- `pushSupported(): Promise<boolean>` — `isSupported()` from `firebase/messaging`, plus `'Notification' in window`
  and `process.env.REACT_APP_FIREBASE_VAPID_KEY` present.
- `enableOrderAlerts()` — `Notification.requestPermission()`; if granted: `getToken(messaging, { vapidKey })`,
  `POST { token }`, set the flag; returns `'enabled' | 'denied' | 'unsupported' | 'failed'`.
- `refreshOrderAlerts()` — if flag set and permission `granted`: `getToken` + `POST` (silent, errors logged).
- `disableOrderAlerts()` — `DELETE { token }` (bounded by a 2 s timeout), `deleteToken(messaging)`, clear flag.
- `listenForForegroundMessages(onOrder: (p: {orderId, tenant, title, body}) => void)` — wraps `onMessage`.
- Firebase app initialised once from `firebaseConfig`.

#### 3. App wiring
**File**: `pms-ts/src/App.tsx`
**Changes**:
- After `checkSession` resolves `'authenticated'`, call `refreshOrderAlerts()` (fire-and-forget).
- `?tenant=` support: in `fetchUserProfile`, before `resolveTenant(memberships)`, read
  `new URLSearchParams(window.location.search).get('tenant')`; if it is one of `memberships`, `setTenant(it)`;
  then strip the parameter with `window.history.replaceState` so reloads don't re-apply it.
- `handleSignOut` becomes async: `await disableOrderAlerts()` (errors ignored), then the existing redirect.
- Foreground messages: `listenForForegroundMessages` in the mount effect; show an `OrderAlertToast`
  (title/body, tap → `navigate('/order/<orderId>/<username>')` after switching tenant with
  `setTenant` + full reload when the tenant differs), and `window.dispatchEvent(new CustomEvent('pms:order-committed', { detail }))`.

**File**: `pms-ts/src/Components/OrderAlertToast.tsx` (new) — small fixed-position toast (green theme,
auto-hide after 8 s, dismiss button), no new dependency.

**File**: `pms-ts/src/Components/OrderManager.tsx`
**Changes**: `useEffect` subscribing to `pms:order-committed` and calling `fetchOrders()`; unsubscribe on unmount.

#### 4. Profile toggle
**File**: `pms-ts/src/Components/UserProfile.tsx`
**Changes**: "Order alerts" row with a toggle reflecting the stored flag + `Notification.permission`:
- unsupported → text "Not supported on this browser" (on iPhone: "Add PMS to the Home Screen to enable alerts");
- permission `denied` → text explaining how to allow notifications in browser settings;
- toggling on calls `enableOrderAlerts()` (runs from the click, satisfying the user-gesture requirement);
  toggling off calls `disableOrderAlerts()`; show a short status message.

#### 5. Environment
**Files**: `pms-ts/.env.development`, local `.env`
**Changes**: add `REACT_APP_FIREBASE_VAPID_KEY=` (public Web Push certificate key; see Phase 4). With it
empty the feature hides itself.

### Success Criteria:

#### Automated Verification:
- [ ] Type check: `npx tsc --noEmit -p .` (in `pms-ts`)
- [ ] Lint, zero warnings: `npx eslint --no-eslintrc -c node_modules/eslint-config-react-app/index.js --max-warnings 0 src/App.tsx src/db/notification.ts src/db/apis.ts src/Components/UserProfile.tsx src/Components/OrderManager.tsx src/Components/OrderAlertToast.tsx`
- [ ] CI build like Netlify: `CI=true npm run build`
- [ ] Service worker is published: `test -f build/firebase-messaging-sw.js`

#### Manual Verification:
- [ ] Profile page shows the toggle; turning it on prompts for permission and results in a `POST /notification/devices` 204.
- [ ] Reloading the app sends one refresh `POST`; signing out sends `DELETE` before the redirect.
- [ ] With `REACT_APP_FIREBASE_VAPID_KEY` empty, the toggle is hidden and nothing else changes.
- [ ] Opening `/order/<id>/<user>?tenant=org2` while in `org1` switches to `org2`, and the parameter disappears from the URL.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Devops & Release

### Overview
Provision Firebase credentials, wire them into the swarm stack, add the cache to the production
Infinispan config, and roll out backend-first.

### Changes Required:

#### 1. Firebase console (one-off, manual)
- Project `splendid-sonar-174914` → Project settings → **Cloud Messaging** → Web Push certificates →
  *Generate key pair*; copy the public key (→ `REACT_APP_FIREBASE_VAPID_KEY`).
- Project settings → **Service accounts** → *Generate new private key* (JSON). Never commit it.
- On the swarm manager: `docker secret create firebase_service_account ./service-account.json`, then delete the local file.

#### 2. Production Infinispan config
**File**: `devops/docker-swarm/config/assistant/infinispan.xml`
**Changes**: add the `notification-devices` cache (same block as Phase 1 §4 but with
`urn:infinispan:config:store:rocksdb:14.0` to match this file), after the `users` cache. Copy the file to
`/opt/devops/docker-swarm/config/assistant/` on the server.

#### 3. Stack
**File**: `devops/docker-swarm/stack/ps.yml`
**Changes**:
- `assistant.image` → the release tag containing Phases 1-2.
- `assistant.environment`: `PUSH_NOTIFICATION_ENABLED: 'true'`, `FIREBASE_CREDENTIALS_FILE: /run/secrets/firebase_service_account`.
- `assistant.secrets: [firebase_service_account]`.
- top-level:
  ```yaml
  secrets:
    firebase_service_account:
      external: true
  ```

#### 4. Netlify
- Add `REACT_APP_FIREBASE_VAPID_KEY` to the `pms-ts` site(s) (`pmsdr-ps`, and `pmsts-ps` if it uses the same build), then *Clear cache and deploy*.

#### 5. Release order
1. `vom-assistant`: merge, bump version, tag, push; build and publish the image.
2. `devops` (`dr`): infinispan.xml + ps.yml changes, commit, push; on the server pull, create the secret, `docker stack deploy -c stack/ps.yml ps`.
3. `pms-ts`: merge, bump version, tag, push (Netlify deploys).

### Success Criteria:

#### Automated Verification:
- [ ] Stack file is valid: `docker compose -f devops/docker-swarm/stack/ps.yml config -q`
- [ ] Production cache config contains the new cache: `grep -c 'name="notification-devices"' devops/docker-swarm/config/assistant/infinispan.xml` prints `1`
- [ ] Secret exists on the server: `docker secret inspect firebase_service_account`

#### Manual Verification:
- [ ] Assistant service starts; logs show Firebase initialised and the `notification-devices` cache created.
- [ ] Full end-to-end run from **Manual Testing Steps** passes on a real Android phone.
- [ ] Telegram order notifications still arrive.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:
- Adapter round-trip for `DeviceRegistration` incl. nested organizations and timestamps.
- Controller: token validation, origin whitelist, organizations taken from claims only, ownership on delete.
- Notifier: recipient filtering by organization, message title/body/link/tag, token clean-up on
  `UNREGISTERED`/`INVALID_ARGUMENT`, disabled-feature no-op.
- `commitOrder`: event published once; commit unaffected by publisher failure.

### Integration Tests:
- None automated (no Spring-context/Firebase test harness in the repo); covered by the manual end-to-end run.

### Manual Testing Steps:
1. On an Android phone (Chrome), log in as a staff member of `org1` and `org2`, enable **Order alerts**.
2. Close the PMS tab. Place an order as a guest in `org2` via the ordering app.
3. Notification "Org Two · New order" / "N items" appears within seconds; Telegram also receives the order.
4. Tap it: PMS opens on the order page with `org2` selected.
5. With PMS open on the Order page in `org1`, place an order in `org1`: a toast appears and the list refreshes; no system notification.
6. Place two orders in quick succession: two separate notifications appear (each order has its own tag).
7. Sign out; place another order: this phone gets nothing.
8. Log in as a staff member of `org1` only: an `org2` order does not notify them.
9. Revoke notification permission in browser settings, place an order: backend logs the failed token and removes it once FCM reports it unregistered.

## Performance Considerations

- Sending is async on a 1-2 thread executor; the commit request returns without waiting.
- One FCM call per 500 devices (`sendEach`); expected devices are tens.
- `findByOrganization` scans the cache values; fine for hundreds of devices. If it ever grows large,
  switch to an indexed query like the `users` cache.

## Migration Notes

- New cache only; no existing data changes. Rolling back the image leaves an unused cache in RocksDB.
- Deploy order matters only in one direction: the frontend's toggle calls `/notification/devices`, which
  must exist first (backend before frontend). With `PUSH_NOTIFICATION_ENABLED=false`, Phases 1-2 are inert.
- The devops `infinispan.xml` must be updated before the new image starts, or cache creation fails.

## References

- Design discussion: this session (2026-09-27) — new orders only, all staff of the organization, Telegram unchanged, alerts from all organizations, organization named in the notification.
- Hook point: `vom-assistant/src/main/java/vn/gofarmstay/service/impl/OrderServiceImpl.java:153-219`
- Store pattern: `vom-assistant/src/main/java/vn/gofarmstay/repository/imdg/impl/UserInfoInfinispanCache.java`
- Adapter pattern: `vom-assistant/src/main/java/vn/gofarmstay/config/protoadapter/UserAdapter.java`
- Security matchers: `vom-assistant/src/main/java/vn/gofarmstay/config/SecurityConfiguration.java:181-216`
- Production cache config: `devops/docker-swarm/config/assistant/infinispan.xml`
- Frontend Firebase config: `pms-ts/src/db/configs.ts:154`
