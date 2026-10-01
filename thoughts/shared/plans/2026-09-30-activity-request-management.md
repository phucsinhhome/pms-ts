---
title: 2026-09-30-activity-request-management
type: plan
date: 2026-09-30
status: active
project: pms-ts
scope: shared
author: Minh Trần
ticket: null
tags: [activity, booking, pricing, vom-assistant, pms-ts]
related: []
git_commit: 07de72644876a56352fc5d050fa9e9cf938967dd
branch: develop
repos: [pms-ts, vom-assistant]
---

# Activity Request Management Implementation Plan

## Overview

This plan replaces the unused pms-ts "Tour" screens with a generic **Activity** feature: tours, cooking classes and so on, told apart by a free-text `type`. The backend lives in vom-assistant, which hosts every other admin API.

Hosts define activities: timing window, duration and buffer, base price (VND), group-discount tiers, capacity and a default host. Sessions (one activity on one date in one time slot) are computed from that config. A session is persisted only when a guest or host first acts on it. Guests (backend API only; the viorder UI is a later project) can list activities, see bookable slots during their stay, preview a price, start or join a session, and cancel their own request. Staff manage activities and sessions in pms-ts.

Every session change uses compare-and-swap (Booking's optimistic-locking pattern), so two simultaneous joins can't oversell the last spot. A scheduler completes or cancels sessions whose end time has passed. Completing a session fixes the retroactive group price on each participating request.

## Current State Analysis

**vom-assistant (Spring Boot 3.4.5, Java 17, embedded Infinispan 15 with RocksDB):**
- There is no activity or tour code on `develop`. An old Tour backend sits unmerged on `origin/feature/tour_management`.
- Entities are Lombok `@Builder` classes extending `model/IdentifiedEntry.java`. Each has a hand-written protostream `@ProtoAdapter` in `config/protoadapter/`, registered in `config/cache/CacheSerializationContextInitializer.java`. Each lives in a replicated cache in `src/main/resources/infinispan.xml` and is accessed through a store interface extending `javax.cache.Cache` plus an `AbstractIMDGStore` subclass. `AbstractIMDGStore` is package-private, so store impls must go in `repository/imdg/impl`.
- Optimistic locking exists only in `service/impl/BookingServiceImpl.java`: loops of 3 × (`get` → `toBuilder().version(v+1)` → `store.replace(id, old, new)`) at lines ~172-263, ~298-337 and ~348-374. On failure it returns `null`, which the controllers turn into 404. We will not copy that.
- There is no `@ControllerAdvice` anywhere. Errors are built by hand in each controller.
- Guest-facing controllers (`ReceptionAPI`, `CaterAPI`) have no `@PreAuthorize`. `SecurityConfiguration.java:182-197` sets `/*/cater/**` and `/*/reception/**` to `permitAll`. Staff paths get authorities from `keycloak.enforcer.paths` in `application-security.yml`, and any request not matched there is denied (`SecurityConfiguration.java:216-217`).
- There is one scheduler (`scheduler/InventoryAvailabilityScheduler.java`), using `@Scheduled(cron = "${inventory.availabilityCron}")` plus an `enabled` flag. `@EnableScheduling` is on `AssistanttApplication.java:11`.
- Tests use JUnit 5 and Mockito. Services and controllers are built through their constructors. Adapter round-trips go through the generated `CacheSerializationContextInitializerImpl`.

**pms-ts (React 18 + TS, CRA via react-app-rewired, flowbite-react 0.7):**
- The Tour feature is a stub. `TourManager.tsx` and `TourEditor.tsx` call `REACT_APP_TOUR_ENDPOINT` and `REACT_APP_TOUR_REQUEST_ENDPOINT`, which appear in no `.env` file. Nothing outside `App.tsx`, `db/apis.ts`, `db/tour.ts` and `db/tour-request.ts` imports them.
- A menu item shows only if the user holds an authority equal to its key (`App.tsx:379-391`).
- There are no frontend tests. The gates are `npx tsc --noEmit -p .` (passes today) and `npm run build`.

## Desired End State

- **Staff (pms-ts):** a user with the Keycloak `activity` scope sees an **Activity** menu (no **Tour** menu any more). They can create, edit and delete activities, including the tier and slot settings, and open a **Sessions** screen for any day. That screen shows each slot's status, headcount against capacity, current and projected per-guest price, host and requests. Staff can lock or unlock a slot, change its capacity, assign a host, confirm, cancel, complete, add a request for a guest, and approve or reject requests. If the server returns 409, the screen shows the server's message and refreshes.
- **Guests (API only):** `/{tenant}/reception/activity/**` supports every guest operation. The guest is identified by `resolverId` (an invoice id), and bookable dates are limited to the invoice's check-in to check-out dates, inclusive.
- **Concurrency:** parallel joins for the last spot give one success and one `409 Conflict` with a JSON `{"message": ...}` body. No session ever exceeds `maxCapacity`.
- **Scheduler:** past CONFIRMED sessions become COMPLETED, and each APPROVED request gets `lockedUnitPrice` set. Past PENDING_CONFIRMATION sessions become CANCELLED.
- **How to verify:**
  - `mvn test` in vom-assistant has no failures beyond the baseline recorded in Phase 0 (the five `Tax*` test classes already failing on `develop`), and the Spring-context test `TelegramBotApplicationTests` passes.
  - `npx tsc --noEmit -p .` and `npm run build` pass in pms-ts.
  - The manual steps under Testing Strategy all succeed.
  - After Phase 8 the feature runs in production.

### Key Discoveries:
- **Model pattern:** `model/Booking.java:14,33-34` uses `@Builder(toBuilder = true)` and `@Builder.Default private long version = 0L`. `model/Invoice.java:18,73` uses `@Jacksonized` so JSON request bodies deserialize through the builder.
- **Adapter pattern:** `config/protoadapter/BookingAdapter.java` uses boxed `Long`/`Short` with null-to-default in the factory, and `collectionImplementation = ArrayList.class` for lists. Enum adapters follow `OrderStatusAdapter.java`. The shared `LocalDateAdapter`, `LocalTimeAdapter` and `LocalDateTimeAdapter` are already registered in `CacheSerializationContextInitializer.java`.
- **Indexing conventions:** `@Keyword` for exact match (e.g. `Order.java:26` on an enum) and `@Basic` for ranges and sorting (e.g. `Invoice.java:29` on a `LocalDate`). LocalDate range queries with parameters are proven in `InvoiceStoreImpl.java:38-41`, and enum `IN` queries in `OrderStoreImpl.java:54-58`.
- **Cache block to copy:** `infinispan.xml:241-255` (`rate-plans`). Each cache has its own `expiration path` and indexing `path`. Every cache uses `<persistence passivation="false">`, which makes RocksDB write-through. So `memory when-full="REMOVE"` only drops the in-memory copy, and `get`/`replace`/queries reload evicted entries from RocksDB. Eviction cannot lose data.
- **Lifespans:** the `bookings` cache uses `lifespan="300000"` (5 minutes), which is unsuitable here. `tax-policies` uses `31536000000` (1 year) with `interval="-1"`.
- **Pure logic as components:** `service/impl/TaxPolicyEvaluator.java:16` is a dependency-free `@Component`, and its test creates it with `new`.
- **Configuration pattern:** `config/InventoryConfiguration.java` with `properties/InventoryProperties.java` (`enabled`, `availabilityCron`); values in `application.yml:90-94`. Profile files are included at `application.yml:39`.
- **Controller pattern:** constructor-injected like `controller/TaxPolicyController.java:20-25`; verbs like `controller/RatePlanController.java` (GET list / GET `{id}` / PUT create / POST `{id}` update / DELETE `{id}`).
- **pms-ts patterns:** `src/Components/RatePlanManager.tsx:87` (`hasAuthority("rate-plan:delete")`); `src/Components/RoomManager.tsx:8-15` (props shape); `src/Components/InvoiceMap.tsx:60,108-146,162-167` (`fetchSeq` guard, day navigation); `src/Components/ExpenseManager.tsx:559-561` (`listUsers(0, n)` → `rsp.data.content`); `src/App.tsx:291` (`axios.isAxiosError`).

## What We're NOT Doing

- Any viorder (guest) UI. The guest API is backend-only and viorder is not touched.
- Syncing session totals into Invoice Management or Spend Management. `lockedUnitPrice` is recorded, but no `InvoiceItem` is created.
- Email, SMS or push notifications for status or price changes.
- Real-time updates (WebSocket or SSE). The staff screen refreshes when the user acts or on a 409.
- Migrating Tour data. None exists: the old endpoints were never configured.
- Merging or reusing `origin/feature/tour_management` in vom-assistant.
- Cleaning up the "TOUR" service-classification strings: `src/db/classification.ts:3`, the `ExpenseManager.tsx` labels at :605 and :946, the `SupplierManager.tsx` mock data, the `displayNameMappings.TOUR` in `application.yml:29`, and the supplier menu's leftover `displayName: 'Tour'` (`App.tsx:132`). These are expense categories, not the Tour feature.
- Kafka cache-event publishing for the new caches. The new stores register no `KafkaStoreEventListener`.
- Adult/child split. `partySize` is the total number of people.
- Fixed-amount discounts. Tiers are percentages only.
- Snapshotting the price on a session. Completion prices use the activity's price and tiers at the moment of completion.
- A tenant-aware scheduler (see Phase 4).
- Keycloak configuration as code. That step is manual and documented below.

## Implementation Approach

The backend is built bottom-up: persistence, then pure pricing and slot logic, then the activity admin API, then session operations (the concurrency core), then the guest API. After that come the two pms-ts phases, then the production release (Phase 8). Each phase compiles, passes its tests, and can merge into `develop` alone.

**Decisions that apply everywhere:**

1. **Session id** is `{activityId}_{yyyyMMdd}_{HHmm}`, for example `3f2a…c9_20261015_0800`. It is deterministic, so creation uses `putIfAbsent` and two first-time actions on the same slot can't create duplicates. It is also URL-safe.
2. **Capacity:** a request holds capacity while it is PENDING or APPROVED. `headcount` is the sum of their `partySize`. `approvedHeadcount` is the sum over APPROVED only.
3. **Confirmation:** after any change that approves a request, a PENDING_CONFIRMATION session automatically becomes CONFIRMED once `approvedHeadcount >= activity.minGuests`. Hosts can also confirm manually. A CONFIRMED session is never automatically un-confirmed.
4. **Price:** `unitPrice(h) = round(basePrice × (100 − pct(h)) / 100)`, where `pct(h)` comes from the tier with `minGuests ≤ h ≤ (maxGuests ?? ∞)`. If no tier matches, including when h < 1, the discount is 0%.
   - `currentUnitPrice` uses `approvedHeadcount`; `projectedUnitPrice` uses `headcount`.
   - When a session completes, APPROVED requests get `lockedUnitPrice = unitPrice(approvedHeadcount)`. Requests still PENDING become CANCELLED and are not priced. REJECTED and CANCELLED requests are left as they are.
5. **Error responses:** errors come back as `{"message": "..."}` from a scoped `@RestControllerAdvice`. `ActivityNotFoundException` → 404, `ActivityConflictException` → 409 (capacity exceeded, invalid state change, locked session, retries exhausted), `IllegalArgumentException` → 400.
6. **Tenant isolation:** loading an entity whose `tenantId` differs from the path tenant returns 404.
7. **Time:** all "now" checks use server-local time (`LocalDateTime.now(clock)`), which assumes the server's timezone is the property's timezone. That is already true for `Order` and `Booking`.

---

## Phase 0: Branches

### Overview
Create the feature branch in both repos before making any change.

### Changes Required:

#### 1. vom-assistant
**Command**: `git -C C:/apps/ps/vom-assistant switch -c feature/activity_request_management develop`
**Note**: The unrelated local change to `.run/AssistantApplication_LOCAL.run.xml` carries over into the new branch's working tree. Never stage it: commit with explicit paths (`git add src/...`), never `git add -A` or `git commit -a`.

#### 2. pms-ts
**Command**: `git -C C:/apps/ps/pms-ts switch -c feature/activity_request_management develop`

#### 3. Test baseline (vom-assistant)
**Command**: run `mvn test` in `C:/apps/ps/vom-assistant` on the new branch before changing anything, and record which test classes fail.
- The expected baseline is five pre-existing failures: `TaxControllerTest`, `TaxPolicyControllerTest`, `TaxPolicyEvaluatorTest`, `TaxPolicyServiceTest` and `TaxPreviewServiceTest`. For example, `TaxControllerTest.java:51` reflects on a `collectTaxableInvoices` signature that no longer matches `TaxController.java:47-51`.
- These are out of scope. Every later "full suite" gate means **no failing classes beyond this baseline**.
- The full suite includes `study/telegrambot/TelegramBotApplicationTests` (`@SpringBootTest`, about 5 minutes). It is the only automated check that the cache, schema and profile registrations boot.

### Success Criteria:

#### Automated Verification:
- [x] vom-assistant is on the branch: `git -C C:/apps/ps/vom-assistant branch --show-current` prints `feature/activity_request_management`
- [x] pms-ts is on the branch: `git -C C:/apps/ps/pms-ts branch --show-current` prints `feature/activity_request_management`
- [x] The baseline is recorded: `mvn test` has run, and its list of failing classes is noted in the PR description or the implementation notes

#### Manual Verification:
- [x] `git -C C:/apps/ps/vom-assistant status --short` shows only ` M .run/AssistantApplication_LOCAL.run.xml`, and it stays unstaged for the whole feature

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 1: Backend Data Model & Persistence

### Overview
Add the entities, enums, protostream adapters, schema registration, two caches, and two stores with tenant-scoped Ickle queries. There are no REST endpoints yet.

(Below, `J` = `C:/apps/ps/vom-assistant/src/main/java/vn/gofarmstay/`, `R` = `C:/apps/ps/vom-assistant/src/main/resources/`, `T` = `C:/apps/ps/vom-assistant/src/test/java/vn/gofarmstay/`.)

### Changes Required:

#### 1. Enums (new)
**Files**: `J/model/ActivitySessionStatus.java`, `J/model/ActivityRequestStatus.java`

```java
public enum ActivitySessionStatus { PENDING_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED }
public enum ActivityRequestStatus { PENDING, APPROVED, REJECTED, CANCELLED }
```

#### 2. Entities (new)
**Files**: `J/model/Activity.java`, `J/model/ActivityPricingTier.java`, `J/model/ActivitySession.java`, `J/model/ActivityRequest.java`
**Changes**: Follow `Booking.java` (`@Builder(toBuilder = true)`, `@Builder.Default version`) and `Invoice.java` (`@Jacksonized` for JSON bodies). Prices are `int` VND, like `RatePlan.basePrice`.

```java
@Setter @Getter @Builder(toBuilder = true) @Jacksonized @Indexed
public class Activity extends IdentifiedEntry {
    @Keyword private String id;
    @Keyword private String tenantId;
    @Keyword private String type;          // free text: "tour", "cooking-class", ...
    @Text    private String title;
    private String description;
    private String imageUrl;
    private int durationMins;
    private int bufferMins;
    private LocalTime openTime;
    private LocalTime closeTime;
    private int basePrice;                 // VND per guest
    private int minGuests;
    private int maxCapacity;
    private String defaultHostId;          // UserInfo.username
    @Builder.Default private List<ActivityPricingTier> pricingTiers = new ArrayList<>();
    @Basic private boolean active;
    // getId()/getTenantId() satisfied by Lombok getters (as in RatePlan)
}

@Setter @Getter @Builder(toBuilder = true) @Jacksonized
public class ActivityPricingTier {
    private int minGuests;
    private Integer maxGuests;             // null = open-ended
    private int discountPct;               // 0..100
}

@Setter @Getter @Builder(toBuilder = true) @Indexed
public class ActivitySession extends IdentifiedEntry {
    @Keyword private String id;            // {activityId}_{yyyyMMdd}_{HHmm}
    @Keyword private String tenantId;
    @Keyword private String activityId;
    @Basic   private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    @Keyword private ActivitySessionStatus status;
    private String hostId;
    private int maxCapacity;
    private boolean locked;
    @Builder.Default private long version = 0L;
    @Builder.Default private List<ActivityRequest> requests = new ArrayList<>();

    public int headcount()         { /* sum partySize where status PENDING|APPROVED */ }
    public int approvedHeadcount() { /* sum partySize where status APPROVED */ }
}

@Setter @Getter @Builder(toBuilder = true) @Jacksonized
public class ActivityRequest {
    private String requestId;
    private String invoiceId;              // null when staff adds a walk-in
    private String guestName;
    private int partySize;
    private String specialRequests;
    private ActivityRequestStatus status;
    private Integer lockedUnitPrice;       // set on APPROVED requests at COMPLETED
    private LocalDateTime createdAt;
    private String createdBy;              // staff principal name, or "guest:{invoiceId}"
}
```
Name the headcount helpers `headcount()` and `approvedHeadcount()`, not `getX()`, so the adapters and Jackson don't pick them up as properties.

#### 3. Protostream adapters (new)
**Files** (in `J/config/protoadapter/`): `ActivitySessionStatusAdapter.java`, `ActivityRequestStatusAdapter.java`, `ActivityPricingTierAdapter.java`, `ActivityAdapter.java`, `ActivityRequestAdapter.java`, `ActivitySessionAdapter.java`
**Changes**:
- Enum adapters copy **`SInvoiceStatusAdapter.java`**, not `OrderStatusAdapter`, numbering from 0 in declaration order.
  - Every proto value name gets a prefix: `@ProtoEnumValue(number = 1, name = "ACTIVITY_SESSION_CONFIRMED") CONFIRMED`, `@ProtoEnumValue(number = 3, name = "ACTIVITY_REQUEST_CANCELLED") CANCELLED`, and so on.
  - Protobuf enum value names are scoped to the package, and `CONFIRMED`, `REJECTED` and `CANCELLED` are already taken by `OrderStatus` in `vn.gofarmstay` (see the generated `target/classes/proto/cache.proto`). Unprefixed names would break schema registration.
  - The Java enum constants keep their plain names, so Ickle queries still write `s.status IN ('CONFIRMED', ...)`, as `SInvoiceStoreImpl.java:71` does.
- Object adapters copy `BookingAdapter.java`: every primitive is carried as a boxed type (`Integer`, `Long`, `Boolean`) and the `@ProtoFactory` maps null to the default. Lists use `collectionImplementation = java.util.ArrayList.class`.
- Field numbers follow the declaration order above, starting at 1.

```java
@ProtoAdapter(ActivitySession.class)
public class ActivitySessionAdapter {
    @ProtoFactory
    public ActivitySession create(String id, String tenantId, String activityId, LocalDate date,
                                  LocalTime startTime, LocalTime endTime, ActivitySessionStatus status,
                                  String hostId, Integer maxCapacity, Boolean locked, Long version,
                                  List<ActivityRequest> requests) {
        return ActivitySession.builder()...maxCapacity(maxCapacity == null ? 0 : maxCapacity)
                              .locked(Boolean.TRUE.equals(locked)).version(version == null ? 0L : version)
                              .requests(requests == null ? new ArrayList<>() : new ArrayList<>(requests)).build();
    }
    @ProtoField(1) String getId(ActivitySession s) { return s.getId(); }
    // ... 2..11 ...
    @ProtoField(number = 12, collectionImplementation = java.util.ArrayList.class)
    List<ActivityRequest> getRequests(ActivitySession s) { return s.getRequests(); }
}
```

#### 4. Schema registration
**File**: `J/config/cache/CacheSerializationContextInitializer.java`
**Changes**: Add these six adapters to the end of `includeClasses`, with enums and nested types before the classes that contain them: `ActivitySessionStatusAdapter`, `ActivityRequestStatusAdapter`, `ActivityPricingTierAdapter`, `ActivityRequestAdapter`, `ActivityAdapter`, `ActivitySessionAdapter`.

#### 5. Caches
**File**: `R/infinispan.xml`
**Changes**: After the `immigration-registrations` block (ends at line 287), add two blocks copied from `rate-plans` (241-255):

```xml
<replicated-cache name="activities" mode="SYNC" statistics="true">
    <encoding media-type="application/x-protostream"/>
    <expiration lifespan="-1" interval="-1"/>
    <memory when-full="REMOVE" max-count="100"/>
    <persistence passivation="false">
        <rocksdb-store xmlns="urn:infinispan:config:store:rocksdb:15.0" path="rocksdb">
            <expiration path="expired/activities"/>
        </rocksdb-store>
    </persistence>
    <indexing enabled="true" storage="filesystem" path="indexed/activities" startup-mode="none">
        <indexed-entities>
            <indexed-entity>vn.gofarmstay.model.Activity</indexed-entity>
        </indexed-entities>
    </indexing>
</replicated-cache>

<replicated-cache name="activity-sessions" mode="SYNC" statistics="true">
    <encoding media-type="application/x-protostream"/>   <!-- required: replace(k, old, new) compares serialized bytes -->
    <expiration lifespan="31536000000" interval="-1"/>    <!-- 1 year history, same as tax-policies -->
    <memory when-full="REMOVE" max-count="200"/>
    <persistence passivation="false">
        <rocksdb-store xmlns="urn:infinispan:config:store:rocksdb:15.0" path="rocksdb">
            <expiration path="expired/activity-sessions"/>
        </rocksdb-store>
    </persistence>
    <indexing enabled="true" storage="filesystem" path="indexed/activity-sessions" startup-mode="none">
        <indexed-entities>
            <indexed-entity>vn.gofarmstay.model.ActivitySession</indexed-entity>
        </indexed-entities>
    </indexing>
</replicated-cache>
```
Activities never expire. Sessions expire one year after their last write.

#### 6. Stores (new)
**Files**: `J/repository/imdg/ActivityStore.java`, `J/repository/imdg/ActivitySessionStore.java`, `J/repository/imdg/impl/ActivityStoreImpl.java`, `J/repository/imdg/impl/ActivitySessionStoreImpl.java`
**Changes**: Follow `TaxPolicyStore`/`TaxPolicyStoreImpl.java:38-47` (tenant paging) and `OrderStoreImpl.java:54-58` (enum `IN`). `registerListener()` only logs "no listeners registered"; no Kafka. Every list query sets `maxResults(500)` explicitly instead of relying on Infinispan's default result cap.

```java
public interface ActivityStore extends Cache<String, Activity> {
    Page<Activity> findByTenantId(String tenantId, Pageable pageable);          // Ickle: tenant filter, maxResults(500), no ORDER BY (title is analyzed @Text); sort the full result by title in Java, then slice it into PageImpl for the requested page
    Page<Activity> findActiveByTenantId(String tenantId, Pageable pageable);    // AND a.active = true
}

public interface ActivitySessionStore extends Cache<String, ActivitySession> {
    List<ActivitySession> findByTenantAndDateRange(String tenantId, LocalDate from, LocalDate to);
    List<ActivitySession> findByActivityAndDateRange(String tenantId, String activityId, LocalDate from, LocalDate to);
    long countOpenByActivity(String tenantId, String activityId);   // status IN ('PENDING_CONFIRMATION','CONFIRMED')
    List<ActivitySession> findOpenOnOrBefore(LocalDate date);       // ALL tenants, for the scheduler
}
```
Example query: `FROM vn.gofarmstay.model.ActivitySession s WHERE s.tenantId = :tenantId AND s.activityId = :activityId AND s.date >= :fromDate AND s.date <= :toDate ORDER BY s.date ASC`. Callers sort by `startTime` in Java.

#### 7. Adapter tests (new)
**Files**: `T/config/protoadapter/ActivityAdapterTest.java`, `T/config/protoadapter/ActivitySessionAdapterTest.java`
**Changes**: Copy the setup from `DeviceRegistrationAdapterTest.java:19-24`. Assert that:
- all fields round-trip, including `LocalTime`, tiers with `maxGuests == null`, enum statuses, `version`, `lockedUnitPrice == null` and not-null, and an empty `requests` list;
- re-serialization is deterministic: `assertArrayEquals(bytes, ProtobufUtil.toWrappedByteArray(ctx, restored))`. The CAS in Phase 4 depends on this.

### Success Criteria:

#### Automated Verification:
- [x] Compiles and the protostream annotation processor generates the schema: `mvn -q compile` (run in `C:/apps/ps/vom-assistant`)
- [x] Adapter tests pass: `mvn test -Dtest=ActivityAdapterTest,ActivitySessionAdapterTest`
- [x] Spring context boots with the new caches and schema: `mvn test -Dtest=TelegramBotApplicationTests`
- [x] Full suite: `mvn test`, with no failing classes beyond the Phase 0 baseline

#### Manual Verification:
- [x] Starting the app locally (IntelliJ `AssistantApplication_LOCAL` run config) logs caches `activities` and `activity-sessions` starting, with no protostream schema errors
- [x] Existing caches (invoices, bookings, rate-plans) still load their data

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Pricing Engine & Slot Generator

### Overview
Add pure, dependency-free `@Component`s (the `TaxPolicyEvaluator.java` pattern) with thorough unit tests, plus the session-id codec.

### Changes Required:

#### 1. Pricing engine (new)
**File**: `J/service/impl/ActivityPricingEngine.java`

```java
@Component
public class ActivityPricingEngine {
    public List<ActivityPricingTier> defaultTiers();   // [1-2:0], [3-5:15], [6-10:30], [11-null:40]
    /** Returns defaults when tiers is null/empty; otherwise validates and returns tiers sorted by minGuests. */
    public List<ActivityPricingTier> normalizeTiers(List<ActivityPricingTier> tiers);
    public int discountPct(List<ActivityPricingTier> tiers, int headcount);   // no match or headcount<1 -> 0
    public int unitPrice(Activity activity, int headcount);                  // Math.round(base*(100-pct)/100.0)
    public PricePreview preview(Activity activity, int currentHeadcount, int partySize);
}

// J/model/PricePreview.java (new)
public record PricePreview(int partySize, int projectedHeadcount, int baseUnitPrice,
                           int discountPct, int unitPrice, int total) {}
```
`preview` uses `projectedHeadcount = currentHeadcount + partySize` and `total = unitPrice × partySize`. It is an estimate: the final price is fixed at completion.

**Tier validation** (`IllegalArgumentException` with a readable message):
- `minGuests ≥ 1`
- `maxGuests` is null or `≥ minGuests`
- `0 ≤ discountPct ≤ 100`
- sorted by `minGuests`, tiers don't overlap (`next.minGuests > prev.maxGuests`), and only the last tier may have `maxGuests == null`

Gaps between tiers are allowed and price at 0% discount.

#### 2. Slot generator (new)
**File**: `J/service/impl/ActivitySlotGenerator.java`

```java
@Component
public class ActivitySlotGenerator {
    public record Slot(LocalTime start, LocalTime end) {}
    /** Loop in int minutes of the day, never LocalTime.plusMinutes (which wraps at midnight and can loop forever):
     *  for (m = open.toSecondOfDay()/60; m + duration <= close.toSecondOfDay()/60; m += duration + buffer) emit(m, m + duration). */
    public List<Slot> slots(Activity activity);
    public Optional<Slot> find(Activity activity, LocalTime start);
    /** openTime < closeTime (no midnight crossing), durationMins >= 1, bufferMins >= 0, at least one slot fits. */
    public void validate(Activity activity);   // IllegalArgumentException
}
```

#### 3. Session id codec (new)
**File**: `J/service/impl/ActivitySessionIds.java`

```java
public final class ActivitySessionIds {
    public record Parts(String activityId, LocalDate date, LocalTime start) {}
    public static String of(String activityId, LocalDate date, LocalTime start); // activityId + "_" + BASIC_ISO_DATE + "_" + HHmm
    public static Parts parse(String sessionId);  // splits on the LAST two '_'; malformed -> ActivityNotFoundException
}
```
Phase 2 also creates the two exceptions: `J/model/ActivityNotFoundException.java` and `J/model/ActivityConflictException.java`, both `extends RuntimeException` with a message constructor. `RemoteStorageActionException` in `model/` is the precedent for exceptions living there.

#### 4. Tests (new)
**Files**: `T/service/impl/ActivityPricingEngineTest.java`, `T/service/impl/ActivitySlotGeneratorTest.java`, `T/service/impl/ActivitySessionIdsTest.java`
**Cases**:
- **Requirements matrix:** base 100 → headcount 1,2 → 100; 3,5 → 85; 6,10 → 70; 11,40 → 60. Base 500000 → 425000 / 350000 / 300000.
- **Tiers:** empty or null tiers are seeded with defaults; overlapping tiers, an open-ended tier that isn't last, and pct 101 are rejected; a gap prices at base; headcount 0 prices at base.
- **Preview:** with current headcount 2 and party 2, `unitPrice` = 85 and `total` = 170.
- **Slots:** 08:00-17:00, 240 min, 60 min buffer → `[08:00-12:00, 13:00-17:00]` (the requirements example). 08:00-12:00, 90 min, 0 buffer → 2 slots. A last slot that doesn't fit is dropped. `closeTime <= openTime` is rejected. 20:00-23:30 with 240 min → no slots, so `validate` rejects it, and the call ends instead of looping. Use `assertTimeoutPreemptively` for that case.
- **Session ids:** `of` → `parse` round-trips; malformed ids throw `ActivityNotFoundException`.

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `mvn test -Dtest=ActivityPricingEngineTest,ActivitySlotGeneratorTest,ActivitySessionIdsTest`
- [x] Full suite: `mvn test`, with no failing classes beyond the Phase 0 baseline

#### Manual Verification:
- [x] A reviewer confirms the tier table in `defaultTiers()` matches the requirements matrix (1-2 0%, 3-5 15%, 6-10 30%, 11+ 40%)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Activity Admin API

### Overview
Add the activity CRUD service and controller, the scoped exception handler, and the security path block.

### Changes Required:

#### 1. Service (new)
**Files**: `J/service/ActivityService.java`, `J/service/impl/ActivityServiceImpl.java` (constructor injection of `ActivityStore`, `ActivitySessionStore`, `ActivityPricingEngine`, `ActivitySlotGenerator`)

```java
public interface ActivityService {
    Page<Activity> list(String tenantId, Pageable pageable);
    Page<Activity> listActive(String tenantId, Pageable pageable);
    Activity get(String tenantId, String activityId);                   // 404 if missing or other tenant
    Activity create(String tenantId, Activity activity);                // id = UUID, tenantId forced
    Activity update(String tenantId, String activityId, Activity activity);
    void delete(String tenantId, String activityId);
}
```
- **Create and update:** trim `type` and `title` (both required); require `basePrice ≥ 0`, `minGuests ≥ 1` and `maxCapacity ≥ minGuests`; call `slotGenerator.validate`; set `pricingTiers = pricingEngine.normalizeTiers(...)`. Null or empty tiers on create or update mean "use defaults". `store.put` (last write wins, as for rate plans).
- **Effect of edits:** changing the config does not change sessions that already exist. They keep their stored start and end times and `maxCapacity`. Virtual slots follow the new config.
- **Delete:** throws `ActivityConflictException("Activity has open sessions; deactivate it instead")` if `sessionStore.countOpenByActivity(...) > 0`. Otherwise it removes the activity.

#### 2. Controller (new)
**File**: `J/controller/ActivityController.java`, `@RequestMapping("/{tenant}/activity")`, constructor-injected (`TaxPolicyController` style). Every method has `@PreAuthorize("@securitySupporter.hasTenantAccess(#tenantId)")` and `@P("tenantId") @PathVariable(name = "tenant")`.

| Verb | Path | Body | Returns |
|---|---|---|---|
| GET | `/{tenant}/activity` | – (Pageable) | `Page<Activity>` |
| GET | `/{tenant}/activity/{activityId}` | – | `Activity` |
| PUT | `/{tenant}/activity` | `Activity` | `Activity` (200) |
| POST | `/{tenant}/activity/{activityId}` | `Activity` | `Activity` |
| DELETE | `/{tenant}/activity/{activityId}` | – | 200 empty |

#### 3. Exception handler (new)
**File**: `J/controller/ActivityExceptionHandler.java`

```java
@RestControllerAdvice(assignableTypes = {ActivityController.class})   // extended in Phases 4 and 5
public class ActivityExceptionHandler {
    @ExceptionHandler(ActivityNotFoundException.class) ResponseEntity<Map<String, String>> notFound(ActivityNotFoundException e);  // 404
    @ExceptionHandler(ActivityConflictException.class) ResponseEntity<Map<String, String>> conflict(ActivityConflictException e);  // 409
    @ExceptionHandler(IllegalArgumentException.class)  ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException e); // 400
}
```
The advice is scoped to the activity controllers, so error handling for every other endpoint stays the same.

#### 4. Security
**File**: `R/application-security.yml`
**Changes**: After the "Rate Plan Management" block (ends at line 252), add this block copied from Room (223-237):

```yaml
    - name: Activity Management
      path: /*/activity/**
      methods:
        - method: GET
          scopes:
            - activity
        - method: POST
          scopes:
            - activity:write
        - method: PUT
          scopes:
            - activity:create
        - method: DELETE
          scopes:
            - activity:delete
```
The guest paths `/{tenant}/reception/activity/**` match `/*/reception/**`, which is `permitAll` (`SecurityConfiguration.java:189`), not this block.

#### 5. Tests (new)
**Files**: `T/service/impl/ActivityServiceImplTest.java`, `T/controller/ActivityControllerTest.java`, `T/controller/ActivityExceptionHandlerTest.java`
**Cases**:
- **Create:** seeds default tiers when none are given, forces id and tenant, and rejects an invalid window (400 path).
- **Get and update:** a different tenant gets 404.
- **Delete:** with `countOpenByActivity > 0`, delete throws `ActivityConflictException`.
- **Controller:** methods are called directly with a mocked service (the `TaxPolicyControllerTest` style).
- **Handler:** its methods are called directly and return the right status plus a `message` body.

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `mvn test -Dtest=ActivityServiceImplTest,ActivityControllerTest,ActivityExceptionHandlerTest`
- [ ] Full suite: `mvn test`, with no failing classes beyond the Phase 0 baseline

#### Manual Verification:
- [ ] Keycloak manual step done (see Migration Notes): resource `activity` with the plain scopes `write`, `create`, `delete`, granted to the staff test user. The profile's `authorities` then include `activity`, `activity:write`, `activity:create` and `activity:delete`.
- [ ] With a staff token: `PUT /assistant/{tenant}/activity` with no tiers returns the four default tiers; `GET` lists it; `POST /{id}` updates it; `DELETE /{id}` removes it
- [ ] A user without the `activity:create` scope gets 403 on PUT

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Session & Request Operations for Staff (plus CAS and Scheduler)

### Overview
Add lazy session creation, the view model that merges stored sessions with computed slots, every staff session and request operation built on one CAS helper, and the auto-complete scheduler.

### Changes Required:

#### 1. View and input models (new)
**Files**: `J/model/ActivitySessionView.java`, `J/model/ActivityRequestInput.java`

```java
public record ActivitySessionView(String sessionId, String activityId, String activityTitle, String activityType,
        LocalDate date, LocalTime startTime, LocalTime endTime,
        String status,                 // "AVAILABLE" for virtual slots, else ActivitySessionStatus.name()
        boolean materialized, boolean locked, String hostId,
        int maxCapacity, int headcount, int approvedHeadcount, int remaining, boolean full,
        int minGuests, int currentUnitPrice, int projectedUnitPrice, long version,
        List<ActivityRequest> requests) {}

public record ActivityRequestInput(String invoiceId, String guestName, Integer partySize, String specialRequests) {}
public record CapacityInput(Integer maxCapacity) {}   // body of POST .../capacity
public record HostInput(String hostId) {}             // body of POST .../host
```
Guest POST bodies also bind to `ActivityRequestInput`. The reception controller ignores any `invoiceId` and `guestName` in the body and takes both from the resolved invoice. `GuestStay` (Phase 5) lives in `J/model/GuestStay.java` so the service interface doesn't depend on `service.impl`.

#### 2. Session service (new)
**Files**: `J/service/ActivitySessionService.java`, `J/service/impl/ActivitySessionServiceImpl.java`
Two constructors:
- `@Autowired` public: `(ActivityStore, ActivitySessionStore, ActivityPricingEngine, ActivitySlotGenerator, ActivityProperties)`, which uses `Clock.systemDefaultZone()`.
- package-private: the same arguments plus `Clock`, for tests.

```java
public interface ActivitySessionService {
    List<ActivitySessionView> listForStaff(String tenantId, String activityId /*nullable*/, LocalDate from, LocalDate to);
    ActivitySessionView get(String tenantId, String sessionId);
    ActivitySessionView lock(String tenantId, String sessionId, boolean locked);
    ActivitySessionView setCapacity(String tenantId, String sessionId, int maxCapacity);
    ActivitySessionView assignHost(String tenantId, String sessionId, String hostId);
    ActivitySessionView confirm(String tenantId, String sessionId);
    ActivitySessionView cancel(String tenantId, String sessionId);
    ActivitySessionView complete(String tenantId, String sessionId);
    ActivitySessionView addRequest(String tenantId, String sessionId, ActivityRequestInput input, String actor, boolean byStaff);
    ActivitySessionView approveRequest(String tenantId, String sessionId, String requestId);
    ActivitySessionView rejectRequest(String tenantId, String sessionId, String requestId);
    ActivitySessionView cancelRequest(String tenantId, String sessionId, String requestId, String ownerInvoiceId);
    PricePreview previewPrice(String tenantId, String sessionId, int partySize);   // never persists
    int closeEndedSessions(LocalDateTime now);                                     // scheduler entry point
}
```

**Core helpers:**

```java
/** In-memory session for a virtual slot. NEVER persisted by itself. */
private ActivitySession virtualSession(String tenantId, String sessionId) {
    Parts p = ActivitySessionIds.parse(sessionId);
    Activity a = activityStore.get(p.activityId());          // null/other tenant -> ActivityNotFoundException
    Slot slot = slotGenerator.find(a, p.start()).orElseThrow(() -> new ActivityNotFoundException("No such slot"));
    return ActivitySession.builder().id(sessionId).tenantId(tenantId).activityId(a.getId())
            .date(p.date()).startTime(slot.start()).endTime(slot.end())
            .status(ActivitySessionStatus.PENDING_CONFIRMATION).hostId(a.getDefaultHostId())
            .maxCapacity(a.getMaxCapacity()).locked(false).version(0L).requests(new ArrayList<>()).build();
}

/**
 * Booking CAS pattern (BookingServiceImpl ~298-337); change must return a NEW object built via toBuilder.
 * allowCreate=true only for operations that may start a session (addRequest, lock, setCapacity, assignHost).
 * A virtual session is persisted ONLY after `change` succeeded, via putIfAbsent(next): a rejected first
 * action never writes anything.
 */
private ActivitySession mutate(String tenantId, String sessionId, boolean allowCreate, UnaryOperator<ActivitySession> change) {
    for (int i = 0; i < 3; i++) {
        ActivitySession old = sessionStore.get(sessionId);
        if (old == null) {
            if (!allowCreate) throw new ActivityNotFoundException("Session not found");
            ActivitySession next = change.apply(virtualSession(tenantId, sessionId));   // rules checked first
            next.setVersion(0L);
            if (sessionStore.putIfAbsent(sessionId, next)) return next;
            log.warn("Concurrent creation of activity session {} ({}/3)", sessionId, i + 1);
            continue;                                         // lost the race: next loop takes the CAS path
        }
        requireTenant(old, tenantId);                         // other tenant -> ActivityNotFoundException
        ActivitySession next = change.apply(old);             // throws ActivityConflictException on rule violations
        next.setVersion(old.getVersion() + 1);
        if (sessionStore.replace(sessionId, old, next)) return next;
        log.warn("Concurrent update on activity session {} ({}/3)", sessionId, i + 1);
    }
    throw new ActivityConflictException("The session was changed by someone else; please refresh and retry");
}
```
- **allowCreate** is true for `addRequest`, `lock`, `setCapacity` and `assignHost`. It is false for `approveRequest`, `rejectRequest`, `cancelRequest`, `confirm`, `cancel` and `complete`. On an unstored session those return 404 and write nothing.
- **Validate early:** `partySize` and `maxCapacity` are checked (400) before any store access.
- **Immutability:** the `change` lambdas always build a new `requests` list (`new ArrayList<>(old.getRequests())`) and replace a request with `req.toBuilder()...build()`, never changing it in place. `BookingServiceImpl.java:~318` explains why.
- **Concurrency safety:** rules are checked inside `change`, against the freshly read (or virtual) `old`. That is what makes the capacity check safe under concurrency.

**Operation rules** (each violation throws `ActivityConflictException` with the quoted message unless noted):

| Operation | Allowed when | Effect |
|---|---|---|
| `addRequest` | status is PENDING_CONFIRMATION or CONFIRMED ("Session is {status}"); not `locked` ("Session is locked"); `partySize ≥ 1` (400); `headcount + partySize ≤ maxCapacity` ("Only {n} spots left"); guests only: start time is in the future and no active request with the same `invoiceId` exists ("You already have a request for this session") | New request with a UUID `requestId`. Status is APPROVED if `byStaff`, otherwise PENDING. Runs auto-confirm. |
| `approveRequest` | request is PENDING; session is PENDING_CONFIRMATION or CONFIRMED | Request → APPROVED, then auto-confirm (decision 3) |
| `rejectRequest` | request is PENDING or APPROVED; session not COMPLETED or CANCELLED | Request → REJECTED, freeing its capacity. The session is not un-confirmed. |
| `cancelRequest` | the request's `invoiceId` equals `ownerInvoiceId` (otherwise 404); request PENDING or APPROVED; session not COMPLETED or CANCELLED | Request → CANCELLED |
| `lock(true/false)` | session not COMPLETED or CANCELLED | Sets `locked`. Approving existing requests still works while locked. |
| `setCapacity` | `maxCapacity ≥ 1` (400); `maxCapacity ≥ headcount` ("Capacity cannot be below the current headcount {h}") | Sets `maxCapacity` |
| `assignHost` | session not COMPLETED or CANCELLED | Sets `hostId`. Blank clears it. |
| `confirm` | PENDING_CONFIRMATION | → CONFIRMED |
| `cancel` | PENDING_CONFIRMATION or CONFIRMED | → CANCELLED; every PENDING or APPROVED request → CANCELLED |
| `complete` | CONFIRMED (hosts may complete early) | → COMPLETED; APPROVED requests get `lockedUnitPrice = unitPrice(approvedHeadcount)` and PENDING requests become CANCELLED (decision 4) |

- A CANCELLED session keeps its slot. The slot can't be re-booked, because the host cancelled it.
- **Locked slots:** the lock blocks new requests from guests and staff alike. A host who wants to add someone unlocks first.
- `listForStaff`:
  - requires the range `from..to` (inclusive) to cover at most `activity.maxRangeDays` (31) days, i.e. `ChronoUnit.DAYS.between(from, to) < 31`, else 400;
  - loads the activities: the one given (404 if missing), or `activityStore.findActiveByTenantId(tenant, PageRequest.of(0, 100))` for "all";
  - for each day and each generated slot, emits either the stored session or a virtual view (`status "AVAILABLE"`, `maxCapacity`/`hostId` from the activity, headcount 0);
  - also includes stored sessions that no longer match a slot, and stored sessions of inactive **or deleted** activities. The activity is looked up with `activityStore.get`; if it is null, `activityTitle` is `"(deleted activity)"`, `activityType` is `""` and `minGuests` is 0, so the view never throws on a missing activity;
  - sorts by date, then start time, then activity title.

#### 3. Staff session controller (new)
**File**: `J/controller/ActivitySessionController.java`, `@RequestMapping("/{tenant}/activity/sessions")`, constructor-injected, same `@PreAuthorize` as Phase 3. The actor is `principal == null ? "staff" : principal.getName()`, from a `java.security.Principal` parameter.

| Verb | Path | Body |
|---|---|---|
| GET | `/{tenant}/activity/sessions?activityId=&fromDate=&toDate=` (ISO dates, `@DateTimeFormat(iso = DATE)`) | – |
| GET | `/{tenant}/activity/sessions/{sessionId}` | – |
| POST | `.../{sessionId}/lock`, `/unlock`, `/confirm`, `/cancel`, `/complete` | – |
| POST | `.../{sessionId}/capacity` | `{"maxCapacity": 12}` |
| POST | `.../{sessionId}/host` | `{"hostId": "minhtran"}` |
| POST | `.../{sessionId}/requests` | `ActivityRequestInput` (staff: APPROVED immediately) |
| POST | `.../{sessionId}/requests/{requestId}/approve`, `/reject` | – |

All of these return `ActivitySessionView`. Spring picks the literal `/sessions` over `ActivityController`'s `/{activityId}`. Every POST requires `activity:write`, which is covered by the Phase 3 yml block.

**Also modify** `J/controller/ActivityExceptionHandler.java`: add `ActivitySessionController.class` to `assignableTypes`.

#### 4. Scheduler and configuration (new)
**Files**: `J/properties/ActivityProperties.java`, `J/config/ActivityConfiguration.java`, `J/scheduler/ActivitySessionScheduler.java`, `R/application-activity.yml`
**Modify**: `R/application.yml:39`: append `,activity` to `spring.profiles.include`.

```java
@Getter @Setter public class ActivityProperties { private boolean enabled; private String sessionCron; private int maxRangeDays = 31; }

@Configuration public class ActivityConfiguration {
    @Bean @ConfigurationProperties(prefix = "activity") ActivityProperties activityProperties() { return new ActivityProperties(); }
}

@Slf4j @Component
public class ActivitySessionScheduler {   // public @Autowired ctor (ActivityProperties, ActivitySessionService) using Clock.systemDefaultZone(); package-private ctor adds Clock for tests (the repo has no Clock bean)
    @Scheduled(cron = "${activity.sessionCron}")
    void closeEndedSessions() {
        if (!props.isEnabled()) return;
        int n = sessionService.closeEndedSessions(LocalDateTime.now(clock));
        log.info("Activity session sweep closed {} sessions", n);
    }
}
```
```yaml
# R/application-activity.yml
activity:
  enabled: ${ACTIVITY_SESSION_CRON_ENABLED:true}
  sessionCron: ${ACTIVITY_SESSION_CRON:0 */15 * * * *}
  maxRangeDays: 31
```
`closeEndedSessions(now)`:
- queries `sessionStore.findOpenOnOrBefore(now.toLocalDate())` **across all tenants**, with no tenant filter. The existing scheduler isn't tenant-aware either, and each session carries its own `tenantId`, which is passed to `mutate`;
- keeps the sessions where `LocalDateTime.of(date, endTime)` is before `now`;
- runs `complete` on CONFIRMED sessions and `cancel` on PENDING_CONFIRMATION sessions;
- catches `ActivityConflictException` for each session, logs it and continues;
- returns how many sessions changed.

On a multi-node cluster every node runs the sweep. CAS makes that safe: whichever node loses sees the new status and skips the session.

#### 5. Tests (new)
**Files**: `T/service/impl/ActivitySessionServiceImplTest.java`, `T/service/impl/ActivitySessionServiceImplOptimisticLockingTest.java`, `T/controller/ActivitySessionControllerTest.java`, `T/scheduler/ActivitySessionSchedulerTest.java`
**Cases**:
- **Materialize:**
  - The first successful `addRequest` or `lock` on a virtual slot calls `putIfAbsent` once, with the already-changed session (PENDING_CONFIRMATION, capacity and host from the activity).
  - When `putIfAbsent` returns false (a lost race), the next attempt re-reads the winner and goes through `replace`.
  - A start time that isn't a slot gives 404.
  - **No stray writes:** a party larger than `maxCapacity` on a virtual slot → 409, with `putIfAbsent` and `replace` never called. `complete`, `confirm` and `approveRequest` on an unstored session → 404, again with no store writes.
- **Capacity:** 9/10 plus a party of 2 → 409 "Only 1 spots left". A CANCELLED or COMPLETED session → 409. A locked session → 409 for a new request, while approve still succeeds.
- **Auto-confirm:** with `minGuests=4`, approving 2+2 → CONFIRMED. A staff-added party of 4 → CONFIRMED immediately.
- **Complete:** 6 approved + 1 pending at base 100 → APPROVED requests get `lockedUnitPrice=70` and the pending one becomes CANCELLED.
- **setCapacity** below headcount → 409. **Guest duplicate** request → 409. **cancelRequest** with the wrong invoice → 404.
- **CAS (Mockito, `BookingServiceImplOptimisticLockingTest` style):**
  - `replace` stubbed false then true → success after 2 calls, with the version incremented once relative to the second read;
  - `replace` always false → `ActivityConflictException` after exactly 3 `replace` calls;
  - **capacity race:** the first `get` returns 9/10 and `replace` returns false; the second `get` returns 10/10 (another guest took the spot) → 409 "Only 0 spots left" and `replace` is called only once.
- **listForStaff:** merges virtual and stored sessions; range > 31 days → 400.
- **Sweep:** past CONFIRMED → COMPLETED, past PENDING → CANCELLED, future sessions untouched. Uses a fixed `Clock` and an explicit `now`.
- **Scheduler:** `enabled=false` → the service is never called.

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `mvn test -Dtest='ActivitySessionServiceImpl*Test,ActivitySessionControllerTest,ActivitySessionSchedulerTest'`
- [ ] Spring context boots with the new profile, scheduler and `${activity.sessionCron}` placeholder: `mvn test -Dtest=TelegramBotApplicationTests`
- [ ] Full suite: `mvn test`, with no failing classes beyond the Phase 0 baseline

#### Manual Verification:
- [ ] Locally: `GET /activity/sessions?activityId=…&fromDate=…&toDate=…` lists AVAILABLE slots matching the activity config
- [ ] `POST …/{sessionId}/requests` on an AVAILABLE slot creates the session; running the list again shows it as materialized
- [ ] Two parallel `curl` requests for the last spot give exactly one 200 and one 409 with a `message` body
- [ ] With `ACTIVITY_SESSION_CRON="*/30 * * * * *"`, a CONFIRMED session whose end time has passed becomes COMPLETED within a minute, with `lockedUnitPrice` on its APPROVED requests

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Guest API (Reception)

### Overview
Add guest endpoints under the `permitAll` reception prefix, identifying the guest through the existing invoice resolve path.

### Changes Required:

#### 1. Guest resolver (new)
**File**: `J/service/impl/ActivityGuestResolver.java` (`@Component`, constructor-injected `OrderService`)

```java
// returns vn.gofarmstay.model.GuestStay (J/model/GuestStay.java): record GuestStay(String invoiceId, String guestName, LocalDate checkIn, LocalDate checkOut)
public GuestStay resolve(String tenantId, String resolverId);
```
It calls `orderService.resolve(resolverId)`, the same call `CaterAPI.java:85-89` uses, which ends in `invoiceStore.get`. It throws `ActivityNotFoundException("Stay not found")` if:
- `resolverId` is blank,
- the invoice is null,
- `invoice.getTenantId()` differs from the path tenant, or
- `checkInDate` or `checkOutDate` is null.

#### 2. Guest-facing service methods
**Files**: `J/service/ActivitySessionService.java` and `J/service/impl/ActivitySessionServiceImpl.java`
**Changes**: Add this method:

```java
List<ActivitySessionView> listForGuest(String tenantId, String activityId, GuestStay stay);
```
- The date range is `max(today, checkIn)` .. `checkOut`, inclusive.
- The activity must be `active`, else 404.
- It leaves out past slots (start ≤ now) and sessions that are COMPLETED or CANCELLED.
- Each view's `requests` list is filtered down to the guest's own (`invoiceId` match). Other guests' names are never exposed.

Guest joins reuse `addRequest(..., byStaff = false)`. The API layer adds two checks before calling it: the session date must fall inside the stay (`checkIn ≤ date ≤ checkOut`, else 409 "Session is outside your stay"), and the activity must be active (else 409 "Activity is not available").

#### 3. Controller (new)
**File**: `J/controller/ActivityReceptionAPI.java`, `@RequestMapping("/{tenant}/reception/activity")`, with no `@PreAuthorize` (like `ReceptionAPI.java`) and constructor-injected `ActivityService`, `ActivitySessionService` and `ActivityGuestResolver`.

| Verb | Path | Params / body | Returns |
|---|---|---|---|
| GET | `/{tenant}/reception/activity` | Pageable | `Page<Activity>` (active only) |
| GET | `/{tenant}/reception/activity/{activityId}/sessions` | `resolverId` | `List<ActivitySessionView>` (guest-filtered) |
| GET | `/{tenant}/reception/activity/sessions/{sessionId}/price` | `partySize` | `PricePreview` (uses the stored headcount, or 0 for a virtual slot; never persists) |
| POST | `/{tenant}/reception/activity/sessions/{sessionId}/requests` | `resolverId`; body `{partySize, specialRequests}` | `ActivitySessionView`. Starts the session if it isn't stored yet, otherwise joins it. `invoiceId`/`guestName` come from the invoice; `createdBy = "guest:" + invoiceId` |
| POST | `/{tenant}/reception/activity/sessions/{sessionId}/requests/{requestId}/cancel` | `resolverId` | `ActivitySessionView` |

Anyone holding the invoice id can act as that guest. This is the same trust model as the existing Cater order flow.

**No staff data for guests:** the reception endpoints never expose staff usernames.
- `GET /reception/activity` returns each `Activity` copied with `defaultHostId = null`.
- Guest session views are built with `hostId = null`, and their `requests` are already filtered to the guest's own.
- The staff endpoints are unchanged.

**Also modify** `J/controller/ActivityExceptionHandler.java`: add `ActivityReceptionAPI.class` to `assignableTypes`.

#### 4. Tests (new)
**Files**: `T/service/impl/ActivityGuestResolverTest.java`, `T/controller/ActivityReceptionAPITest.java`, plus guest cases added to `T/service/impl/ActivitySessionServiceImplTest.java`
**Cases**:
- **Resolver:** unknown or other-tenant invoice → 404.
- **listForGuest:** covers only the stay dates, drops past slots, and hides other guests' requests.
- **Joins:** a join outside the stay → 409; a join on an inactive activity → 409; a guest join is PENDING and doesn't auto-confirm.
- **Price preview:** on a virtual slot it never calls `putIfAbsent` or `replace`.
- **Cancel:** a guest cancelling someone else's request → 404.

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `mvn test -Dtest='ActivityGuestResolverTest,ActivityReceptionAPITest,ActivitySessionServiceImplTest'`
- [ ] Full suite: `mvn test`, with no failing classes beyond the Phase 0 baseline

#### Manual Verification:
- [ ] Without any token: `GET /assistant/{tenant}/reception/activity/{id}/sessions?resolverId={invoiceId}` returns slots only for the invoice's stay dates
- [ ] A guest starts a session (POST requests on an AVAILABLE slot), a second invoice joins it, and each sees only their own request
- [ ] A bogus `resolverId` returns 404 with a `message`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: pms-ts — Replace Tour with Activity Management

### Overview
Remove Tour entirely, add the activity API module, the menu and route, and `ActivityManager` with the tier editor and slot settings.

(Paths are relative to `C:/apps/ps/pms-ts/`.)

### Changes Required:

#### 1. Remove Tour
**Delete**: `src/Components/TourManager.tsx`, `src/Components/TourEditor.tsx`, `src/db/tour.ts`, `src/db/tour-request.ts`
**Modify** `src/db/apis.ts`: remove lines 65-69 (`tourApi`, `tourRequestApi`) and their exports at 110-111. Add:

```ts
// activityApi
const activityApi = createApiInstance(process.env.REACT_APP_ACTIVITY_ENDPOINT);
// ...export { ..., activityApi }
```

#### 2. Environment
**File**: `.env.development`
**Changes**: After `REACT_APP_RATE_PLAN_ENDPOINT` (line 9), add:
`REACT_APP_ACTIVITY_ENDPOINT=https://localhost:8443/assistant/{tenant}/activity`

#### 3. DB module (new)
**File**: `src/db/activity.ts` (types live in the db module, like `src/db/room.ts`)

```ts
import { activityApi } from "./apis";

export type PricingTier = { minGuests: number; maxGuests: number | null; discountPct: number };
export type Activity = {
  id?: string; tenantId?: string; type: string; title: string; description?: string; imageUrl?: string;
  durationMins: number; bufferMins: number; openTime: string; closeTime: string;   // "HH:mm" (server may send "HH:mm:ss" -> slice(0, 5))
  basePrice: number; minGuests: number; maxCapacity: number; defaultHostId?: string;
  pricingTiers: PricingTier[]; active: boolean;
};
export const DEFAULT_TIERS: PricingTier[] = [
  { minGuests: 1, maxGuests: 2, discountPct: 0 }, { minGuests: 3, maxGuests: 5, discountPct: 15 },
  { minGuests: 6, maxGuests: 10, discountPct: 30 }, { minGuests: 11, maxGuests: null, discountPct: 40 },
];
export const listActivities = (page: number, size: number) => activityApi.get('', { params: { page, size } });
export const getActivity = (id: string) => activityApi.get(`/${id}`);
export const createActivity = (a: Activity) => activityApi.put('', a, { headers: { 'Content-Type': 'application/json' } });
export const updateActivity = (a: Activity) => activityApi.post(`/${a.id}`, a, { headers: { 'Content-Type': 'application/json' } });
export const deleteActivity = (id: string) => activityApi.delete(`/${id}`);
/** Display-only mirror of ActivitySlotGenerator (server is authoritative). */
export const previewSlots = (a: Pick<Activity, 'openTime' | 'closeTime' | 'durationMins' | 'bufferMins'>): { start: string; end: string }[] => { /* same loop */ };
```

#### 4. Manager component (new)
**File**: `src/Components/ActivityManager.tsx`
**Changes**:
- **Props:** the `RoomManager.tsx:8-15` shape (`chat`, `displayName`, `authorizedUserId`, `activeMenu`, `handleUnauthorized`, `hasAuthority`).
- **List:** a paged `Table` (`Pagination` from `./ProfitReport`; Spring page mapping as in `RoomManager.tsx:47-58`) with columns Type, Title, Window (open–close), Duration/Buffer, Base price (`formatVND`), Min/Max guests, Active, and actions: Edit and Delete (shown only with `hasAuthority("activity:delete")`). The **Sessions** buttons are added in Phase 7, together with their route.
- **Add button:** shown only with `hasAuthority("activity:create")`.
- **Edit modal:**
  - fields: `type` (`TextInput` with a `<datalist>` suggesting `tour` and `cooking-class`), `title`, `description` (`Textarea`), `imageUrl`, `openTime`/`closeTime` (`TextInput type="time"`, as in the old `TourEditor.tsx:381-391`), `durationMins`, `bufferMins`, `basePrice`, `minGuests`, `maxCapacity`, `defaultHostId`, and `active` (`Checkbox`);
  - **Host picker** (shared helper `useStaffUsers()` in `src/Components/ActivityManager.tsx`, exported for Phase 7):
    - It calls `listUsers(0, 100)` → `rsp.data.content[].username` in its **own** try/catch.
    - GET `/*/user/**` needs the `user` authority (`application-security.yml:208-213`), which activity staff may not have. So on any error, **including 401 and 403**, it falls back to a free-text `TextInput` for the username.
    - It never calls `handleUnauthorized`.
    - When the list loads, the field is a `Select`;
  - **slot preview:** a read-only list of chips from `previewSlots`;
  - **tier editor:** rows of min / max (blank = open-ended, sent as `null`) / discount %, each with an add and remove button, a "Reset to defaults" button that sets `DEFAULT_TIERS`, and a read-only column showing the resulting per-guest `formatVND` price.
- **Save:** calls `createActivity` when there is no id, otherwise `updateActivity`.
- **Errors:** in `catch`, `axios.isAxiosError(e)`: 401/403 → `props.handleUnauthorized()`; 400/409 → `alert(e.response?.data?.message ?? 'Request failed')`. On a delete 409 ("has open sessions"), the message suggests deactivating instead.

#### 5. App wiring
**File**: `src/App.tsx`
**Changes**:
- lines 19-20: replace the Tour imports with `import { ActivityManager } from "./Components/ActivityManager";`
- line 12: add `FaHiking` to the `react-icons/fa` import (it exists in the installed react-icons)
- line 62: in `menuOrder`, replace `'tour'` with `'activity'`
- lines 124-129: replace `tour: {...}` with `activity: { path: 'activity', displayName: 'Activity', title: 'Activity Management', icon: <FaHiking size={28} /> }`
- lines 654-666: replace both Tour routes with `<Route path="activity" element={<ActivityManager ... activeMenu={() => setActiveMenu(menus.activity)} handleUnauthorized={() => handleLogin()} hasAuthority={(auth: string) => hasAuthority(auth)} />} />`, with props exactly as for the `rate-plan` route at 627-634
- leave line 132 (supplier `displayName: 'Tour'`) alone; it is out of scope

### Success Criteria:

#### Automated Verification:
- [ ] Type check passes: `npx tsc --noEmit -p .` (in `C:/apps/ps/pms-ts`)
- [ ] Production build passes: `npm run build`
- [ ] No Tour feature code remains: `git grep -nE "TourManager|TourEditor|tourApi|tourRequestApi|db/tour" -- src` returns nothing (exit code 1; scoped to `src` because `.planning/` and `.ua/` still mention Tour)

#### Manual Verification:
- [ ] With the `activity` authority, the **Activity** menu shows and **Tour** is gone
- [ ] Creating an activity with no tiers saves, and reopening it shows the four default tiers
- [ ] The slot preview shows 08:00–12:00 and 13:00–17:00 for 08:00–17:00 / 240 / 60
- [ ] An overlapping tier edit shows the server's 400 message
- [ ] Delete and Add buttons are hidden without `activity:delete` / `activity:create`
- [ ] Other menus (Room, Rate Plan, Supplier) are unaffected

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 7: pms-ts — Session Management Screen

### Overview
Add a day-by-day view of all slots, with host actions and request handling.

### Changes Required:

#### 1. DB module additions
**File**: `src/db/activity.ts`

```ts
export type ActivityRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ActivityRequest = { requestId: string; invoiceId?: string; guestName: string; partySize: number;
  specialRequests?: string; status: ActivityRequestStatus; lockedUnitPrice?: number | null; createdAt: string; createdBy: string };
export type SessionStatus = 'AVAILABLE' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type ActivitySessionView = { sessionId: string; activityId: string; activityTitle: string; activityType: string;
  date: string; startTime: string; endTime: string; status: SessionStatus; materialized: boolean; locked: boolean;
  hostId?: string; maxCapacity: number; headcount: number; approvedHeadcount: number; remaining: number; full: boolean;
  minGuests: number; currentUnitPrice: number; projectedUnitPrice: number; version: number; requests: ActivityRequest[] };
export type SessionAction = 'lock' | 'unlock' | 'confirm' | 'cancel' | 'complete';

const s = (id: string) => `/sessions/${encodeURIComponent(id)}`;
export const listSessions = (fromDate: string, toDate: string, activityId?: string) =>
  activityApi.get('/sessions', { params: { fromDate, toDate, activityId } });
export const sessionAction = (id: string, action: SessionAction) => activityApi.post(`${s(id)}/${action}`);
export const setSessionCapacity = (id: string, maxCapacity: number) => activityApi.post(`${s(id)}/capacity`, { maxCapacity });
export const assignSessionHost = (id: string, hostId: string) => activityApi.post(`${s(id)}/host`, { hostId });
export const addSessionRequest = (id: string, body: { invoiceId?: string; guestName: string; partySize: number; specialRequests?: string }) =>
  activityApi.post(`${s(id)}/requests`, body);
export const decideRequest = (id: string, requestId: string, decision: 'approve' | 'reject') =>
  activityApi.post(`${s(id)}/requests/${encodeURIComponent(requestId)}/${decision}`);
```

#### 2. Sessions component (new)
**File**: `src/Components/ActivitySessions.tsx`
**Changes**:
- **Props:** `{ activeMenu, handleUnauthorized, hasAuthority }`.
- **State:** local `date` state (default today; not the App-wide `workDate`). `activityId` comes from `useSearchParams` (`''` = all), with a `Select` filled from `listActivities(0, 100)`.
- **Day navigation:** prev / today / next with `addDays`, copied from `InvoiceMap.tsx:162-167`. The fetch calls `listSessions(formatLocalISODate(date), formatLocalISODate(date), activityId || undefined)`, guarded by a `fetchSeq` ref and showing `LoadingSpinner` while loading (`InvoiceMap.tsx:60,108-146`).
- **One `Card` per slot**, showing:
  - time `startTime.slice(0,5)–endTime.slice(0,5)` and the activity title and type;
  - a status pill (Tailwind span: AVAILABLE gray, PENDING_CONFIRMATION yellow, CONFIRMED green, COMPLETED blue, CANCELLED red), plus a lock icon when locked;
  - `headcount / maxCapacity` ("Full" when `full`) and `approvedHeadcount / minGuests to confirm`;
  - current and projected per-guest price with `formatVND`, and the host.
- **Requests table** (name, invoice, party, special requests, status, and `lockedUnitPrice` when COMPLETED). PENDING rows get Approve and Reject buttons.
- **Actions** (shown only with `hasAuthority("activity:write")` and a status that allows them):
  - Lock / Unlock;
  - Capacity (modal with a number input);
  - Host (modal using `useStaffUsers()` from Phase 6: a `Select`, or a free-text input when the user list is forbidden);
  - Confirm (PENDING_CONFIRMATION);
  - Complete (CONFIRMED; asks for confirmation);
  - Cancel (asks for confirmation);
  - Add request (modal: guest name, invoice id optional, party size, special requests).
- **Errors** (one `runAction(fn)` helper): in `catch`, `axios.isAxiosError(e)`: 401/403 → `props.handleUnauthorized()`; 409 → `alert(e.response?.data?.message ?? 'The session changed; refreshing')` then refetch; 400/404 → alert the message; after any success, refetch.
- **Mount:** `props.activeMenu()` runs on mount.

#### 3. App wiring and entry point
**File**: `src/App.tsx`: import `ActivitySessions`. Next to the `activity` route, add `<Route path="activity/sessions" element={<ActivitySessions activeMenu={() => setActiveMenu(menus.activity)} handleUnauthorized={() => handleLogin()} hasAuthority={(auth: string) => hasAuthority(auth)} />} />`. There is no new menu key; it is reached from the Activity menu.
**File**: `src/Components/ActivityManager.tsx`: add a header button, "Sessions", that goes to `/activity/sessions`. Also add a per-row **Sessions** action that calls `navigate('/activity/sessions?activityId=' + id)`.

### Success Criteria:

#### Automated Verification:
- [ ] Type check passes: `npx tsc --noEmit -p .`
- [ ] Production build passes: `npm run build`

#### Manual Verification:
- [ ] The Sessions screen shows every computed slot for the chosen day; prev/next change day; the activity filter works
- [ ] Locking an AVAILABLE slot materializes it (status becomes PENDING_CONFIRMATION with a lock icon)
- [ ] Adding a staff request of `minGuests` people flips the slot to CONFIRMED and updates the prices
- [ ] Changing capacity below the headcount shows the 409 message and the card refreshes
- [ ] With two browser tabs, joining the last spot in both: one succeeds and the other shows the 409 alert with refreshed numbers
- [ ] Host assignment lists staff usernames and saves them. For a user without the `user` authority, it shows a free-text field instead and does **not** redirect to login.
- [ ] Complete shows `lockedUnitPrice` on approved requests

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 8: Production Release

### Overview
Ship to production, following the release steps from `thoughts/shared/plans/2026-09-27-order-push-notifications.md` (Phase 4 there). The `devops` repo is a separate checkout that isn't on this machine. Create a `feature/activity_request_management` branch there too before editing.

### Changes Required:

#### 1. Production Infinispan config
**File**: `devops/docker-swarm/config/assistant/infinispan.xml` (devops repo)
**Changes**:
- Add the `activities` and `activity-sessions` blocks from Phase 1 §5, but with `xmlns="urn:infinispan:config:store:rocksdb:14.0"` to match that file.
- Keep this plan's lifespans (`-1` for activities, `31536000000` for sessions) instead of that file's 60-day default.
- Copy the file to `/opt/devops/docker-swarm/config/assistant/` on the server.

#### 2. Stack
**File**: `devops/docker-swarm/stack/ps.yml`
**Changes**: set `assistant.image` to the vom-assistant release tag that contains Phases 1-5. No new environment variables are needed; the `activity.*` defaults apply.

#### 3. Netlify
Add `REACT_APP_ACTIVITY_ENDPOINT=https://<prod-host>/assistant/{tenant}/activity` to both pms-ts sites (`pmsdr-ps`, `pmsts-ps`). Use the same host as the existing `REACT_APP_RATE_PLAN_ENDPOINT` on each site. Then run **Clear cache and deploy**.

#### 4. Keycloak (production realm)
Repeat the Keycloak steps from Migration Notes in the production realm.

#### 5. Release order
1. `vom-assistant`: merge to `develop`, bump version, tag, push; build and publish the image.
2. `devops`: update `infinispan.xml` and `ps.yml`, commit and push. On the server, pull, then `docker stack deploy -c stack/ps.yml ps`. The new caches must be in the XML **before** the new image starts.
3. Keycloak: set up the production resource and permissions.
4. `pms-ts`: merge, bump version, tag, push. Netlify then deploys with the new environment variable.

### Success Criteria:

#### Automated Verification:
- [ ] (run in the devops checkout) Production cache config contains both caches: `grep -cE 'name="(activities|activity-sessions)"' devops/docker-swarm/config/assistant/infinispan.xml` prints `2`
- [ ] (run in the devops checkout) Stack file is valid: `docker compose -f devops/docker-swarm/stack/ps.yml config -q`

#### Manual Verification:
- [ ] The production `assistant` service starts, and its logs show the `activities` and `activity-sessions` caches starting with no schema errors
- [ ] On production pms-ts, a staff user with the `activity` authority sees the Activity menu, can create an activity, and sees its slots on the Sessions screen
- [ ] The existing Room, Rate Plan, Order and Invoice screens still work in production

---

## Testing Strategy

### Unit Tests:
- **Adapters:** round-trip every field. Re-serialization must be byte-identical, which the CAS depends on.
- **Pricing:** the requirements matrix at base 100 and 500000 VND, tier validation, gaps, headcount 0, rounding.
- **Slots:** the requirements example (08:00–12:00, 13:00–17:00), a last slot that doesn't fit, invalid windows. Session-id round-trip.
- **Activity service:** default-tier seeding, tenant isolation, delete blocked by open sessions.
- **Session service:** each row of the operation-rules table, auto-confirm, completion price locking, guest filtering.
- **CAS:** retry then success, three failures → 409, capacity race with a changed re-read → 409 with no second `replace`, materialization race through `putIfAbsent == false`.
- **Scheduler:** the disabled flag; the cross-tenant sweep with a fixed clock.
- **Controllers and exception handler:** called directly, not through MockMvc (repo convention).

### Integration Tests:
- `study/telegrambot/TelegramBotApplicationTests` (`@SpringBootTest contextLoads`, about 5 minutes) is the one existing Spring-context test. It boots `infinispan.xml`, the protostream schema, the profile include list and the scheduler placeholder, so it is an explicit gate in Phases 1 and 4.
- There are no Infinispan-backed store or Ickle query tests; the repo has none to follow. Queries and end-to-end behaviour are covered by the manual steps below, run against a locally started vom-assistant and pms-ts (`npm start`).

### Manual Testing Steps:
1. Create "Mekong morning" (`type=tour`, 08:00–17:00, 240/60, base 500000, min 3, max 12, no tiers). Confirm the default tiers are shown.
2. Using reception endpoints with two different invoice ids inside the stay, have guest A start the 08:00 slot with party 2 and guest B join with party 2. Price preview for another party of 2 should show 350000/guest (headcount 6).
3. In pms-ts Sessions, approve both requests. The slot auto-confirms (4 ≥ 3), and the current price becomes 425000.
4. Lower capacity to 3 → 409 message. Set it to 5, then have guest C try party 2 → 409 "Only 1 spots left".
5. Lock the slot and have a guest try to join → 409 "Session is locked".
6. Complete the slot. Both requests show `lockedUnitPrice` 425000.
7. Leave a PENDING_CONFIRMATION session in the past and run the sweep (short cron). It becomes CANCELLED.
8. Delete the activity while it has an open session → 409. Deactivate it instead, and guests no longer see it.

## Performance Considerations

- **Stored queries:** every session query filters on indexed `@Keyword` `tenantId` and `activityId` plus an `@Basic` `date` range, sets an explicit `maxResults(500)`, and is sorted in memory. The staff range is capped at 31 days (`activity.maxRangeDays`), so a query touches at most about a month of one tenant's sessions.
- **Computed slots:** bounded by (days in range) × (slots per day) × (activities). A guest's stay is typically 1–14 days, and a day holds at most `(close − open) / (duration + buffer)` slots, so a guest call produces tens to low hundreds of views and needs no persistence.
- **Price preview** reads at most one cache entry and never writes.
- **CAS:** the three-attempt retry keeps worst-case latency low. Conflicts only happen between writers on the same session.
- **Memory:** `max-count` 100 (activities) and 200 (sessions) keep the heap small. Anything evicted is reloaded from RocksDB, which is write-through (`passivation="false"`).
- **Scheduler:** each run does one indexed query (`date ≤ today AND status IN (...)`, all tenants) every 15 minutes.

## Migration Notes

- **Data:** there is none to migrate. The two new caches start empty. RocksDB and index folders are created under the existing `data/${HOSTNAME}` location, as `expired/activities`, `expired/activity-sessions`, `indexed/activities` and `indexed/activity-sessions`. The Tour UI never had a configured backend, so nothing is lost when it is removed.
- **Schema:** adding six types to `CacheSerializationContextInitializer` only adds to the schema. Existing cache entries are unaffected.
- **Keycloak (manual, per realm, e.g. `ps_dev` and production):**
  1. Scope names are plain words. `SecurityConfiguration.java:111-121` builds authorities as `rsname` plus `rsname + ":" + scope`, so a scope named `activity:write` would become `activity:activity:write`. In the `ps_assistant` client's Authorization settings, reuse the plain scopes that the `rate-plan` resource already uses: `write`, `create` and `delete`. Check the `rate-plan` resource to confirm the exact names.
  2. Create a resource named `activity` with those scopes, mirroring the existing `rate-plan` resource.
  3. Add permissions with the same policies the `rate-plan` permissions use, so the same staff roles get access.
  4. Log out and back in. The profile's `authorities` should now include:
     - `activity`, which shows the menu (`App.tsx:379-391`) and passes GET;
     - `activity:write`, `activity:create` and `activity:delete`, which the yml block and the pms-ts buttons check.
  5. Optional: grant activity staff the `user` resource too, so the host picker shows a dropdown rather than free text.
- **Frontend environment:**
  - `REACT_APP_ACTIVITY_ENDPOINT` is added to `.env.development` for local `npm start`.
  - Production pms-ts is built by **Netlify** (sites `pmsdr-ps` and `pmsts-ps`, per `thoughts/shared/plans/2026-09-27-order-push-notifications.md`). `npm run build` there does not read `.env.development`, so the variable must be set on both Netlify sites (Phase 8). If it is missing, `activityApi` has no base URL and every call fails.
- **Production Infinispan:** production uses a separate `devops/docker-swarm/config/assistant/infinispan.xml`, which uses the `rocksdb:14.0` namespace. If the two new caches are missing there, `AbstractIMDGStore.loadCache()` fails at startup and the backend won't start (Phase 8).
- **Backend configuration:** `ACTIVITY_SESSION_CRON_ENABLED` (default `true`) and `ACTIVITY_SESSION_CRON` (default every 15 minutes) are optional environment overrides.
- **Rollback:**
  - Revert the merge commits in both repos. Roll back the devops `infinispan.xml` (remove the two cache blocks) and the `assistant` image tag **in the same** `docker stack deploy`, so the old image never starts with cache definitions for model classes it lacks.
  - In vom-assistant, the leftover `data/${HOSTNAME}/…activities…` and `…activity-sessions…` folders are inert once the cache definitions are gone, and can be deleted by hand.
  - Removing the Keycloak resource is optional; unused scopes do no harm.
  - Reverting pms-ts brings back the (non-functional) Tour screens.

## References

- Original ticket: `C:\Users\kynzo\Downloads\Activity Request Management - Requirements Document.md`
- Related research: user-approved decisions and verified findings from the planning session (caller-owned)
- Similar implementations:
  - CAS loop: `vom-assistant/src/main/java/vn/gofarmstay/service/impl/BookingServiceImpl.java:172-263, 298-337, 348-374`
  - CAS test: `vom-assistant/src/test/java/vn/gofarmstay/service/impl/BookingServiceImplOptimisticLockingTest.java`
  - Versioned model: `vom-assistant/src/main/java/vn/gofarmstay/model/Booking.java:14,33-34`
  - Boxed-field adapter: `vom-assistant/src/main/java/vn/gofarmstay/config/protoadapter/BookingAdapter.java`
  - Enum adapter: `vom-assistant/src/main/java/vn/gofarmstay/config/protoadapter/SInvoiceStatusAdapter.java (prefixed proto value names)`
  - Schema registration: `vom-assistant/src/main/java/vn/gofarmstay/config/cache/CacheSerializationContextInitializer.java`
  - Cache block: `vom-assistant/src/main/resources/infinispan.xml:241-255`
  - Store queries: `vom-assistant/src/main/java/vn/gofarmstay/repository/imdg/impl/TaxPolicyStoreImpl.java:38-47`, `OrderStoreImpl.java:54-58`, `InvoiceStoreImpl.java:38-41`
  - Controllers: `vom-assistant/src/main/java/vn/gofarmstay/controller/TaxPolicyController.java:20-25`, `RatePlanController.java`, `ReceptionAPI.java`, `CaterAPI.java:85-89`
  - Guest resolve: `vom-assistant/src/main/java/vn/gofarmstay/service/impl/OrderServiceImpl.java:120-129`, `InvoiceServiceImpl.java:85-89`
  - Security: `vom-assistant/src/main/java/vn/gofarmstay/config/SecurityConfiguration.java:182-197`, `vom-assistant/src/main/resources/application-security.yml:223-252`
  - Scheduler and configuration: `vom-assistant/src/main/java/vn/gofarmstay/scheduler/InventoryAvailabilityScheduler.java:36-40`, `config/InventoryConfiguration.java`, `vom-assistant/src/main/resources/application.yml:39,90-94`
  - Pure component: `vom-assistant/src/main/java/vn/gofarmstay/service/impl/TaxPolicyEvaluator.java:16`
  - Adapter test: `vom-assistant/src/test/java/vn/gofarmstay/config/protoadapter/DeviceRegistrationAdapterTest.java:19-24`
  - Controller test: `vom-assistant/src/test/java/vn/gofarmstay/controller/TaxPolicyControllerTest.java`
  - pms-ts Tour wiring: `pms-ts/src/App.tsx:19-20, 62, 124-129, 627-634, 654-666, 379-395`; `pms-ts/src/db/apis.ts:65-69, 110-111`
  - pms-ts UI patterns: `pms-ts/src/Components/RoomManager.tsx:8-15, 47-58`, `RatePlanManager.tsx:87`, `InvoiceMap.tsx:60, 108-146, 162-167`, `ExpenseManager.tsx:559-561`, `TourEditor.tsx:381-391`
  - pms-ts helpers: `pms-ts/src/db/users.ts:21-24`, `pms-ts/src/Service/Utils.ts:1, 45, 86`
  - pms-ts env and deploy: `pms-ts/.env.development`, `pms-ts/Dockerfile`
