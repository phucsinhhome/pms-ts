---
title: "general: Activity Request Management Phases 0-2 done, Phase 3 next"
type: handoff
date: 2026-10-01
status: active
project: pms-ts
scope: shared
author: Minh Trần
ticket: null
tags: [activity, booking, vom-assistant, pms-ts, implementation]
related: [thoughts/shared/plans/2026-09-30-activity-request-management.md, thoughts/shared/handoffs/general/2026-10-01_00-34-31_activity-request-management-planning.md]
researcher: Minh Trần
git_commit: 749d68251580896d6ff8a85b42959e6c8772de79
branch: feature/activity_request_management
repository: pms-ts
topic: "Activity Request Management Implementation Strategy"
last_updated: 2026-10-01
last_updated_by: Minh Trần
body_type: implementation_strategy
---

# Handoff: general, Activity Request Management (Phases 0-2 done, Phase 3 next)

## Task(s)

The task is to implement `thoughts/shared/plans/2026-09-30-activity-request-management.md` (status `active`, Phases 0-8). This session resumed from the planning handoff `2026-10-01_00-34-31_activity-request-management-planning.md`.

1. **Phase 0: branches and baseline. Completed.**
   - `feature/activity_request_management` exists in both pms-ts and vom-assistant, off `develop`.
   - The baseline matches the prediction exactly: 60 tests, 6 failures and 5 errors, all in `TaxControllerTest`, `TaxPolicyControllerTest`, `TaxPolicyEvaluatorTest`, `TaxPolicyServiceTest` and `TaxPreviewServiceTest`.
   - `TelegramBotApplicationTests` passes (about 210 s).
2. **Phase 1: data model and persistence. Completed.** The user did the manual check; committed as vom-assistant `b32d2fe`.
3. **Phase 2: pricing engine, slot generator and session ids. Completed.** The user approved; committed as vom-assistant `71f1940`.
4. **Phase 3: activity admin API. Not started. This is next.**
5. **Phases 4-8: not started.**

## Critical References
- `thoughts/shared/plans/2026-09-30-activity-request-management.md` is the source of truth. Phases 0-2 criteria are ticked; Phase 3 is at "## Phase 3: Activity Admin API" (around line 416).
- `thoughts/shared/handoffs/general/2026-10-01_00-34-31_activity-request-management-planning.md` holds the user decisions and the traps the reviews caught. Its Learnings all still apply, and it is worth re-reading before Phase 3.

## Recent changes

**vom-assistant** (branch `feature/activity_request_management`, commits `b32d2fe` and `71f1940` on top of `de057c4`):
- **Phase 1:**
  - `model/Activity*.java`: `Activity`, `ActivityPricingTier`, `ActivitySession` (with `headcount()` and `approvedHeadcount()`), `ActivityRequest`, and the two status enums.
  - `config/protoadapter/Activity*Adapter.java`: six adapters. The enum value names are prefixed `ACTIVITY_SESSION_*` and `ACTIVITY_REQUEST_*`.
  - `config/cache/CacheSerializationContextInitializer.java`: the six adapters are appended there.
  - `src/main/resources/infinispan.xml`: the `activities` and `activity-sessions` caches, after `immigration-registrations`.
  - `repository/imdg/ActivityStore.java`, `ActivitySessionStore.java` and `impl/Activity*StoreImpl.java`.
  - Tests: `src/test/.../config/protoadapter/ActivityAdapterTest.java` and `ActivitySessionAdapterTest.java`.
- **Phase 2:**
  - `service/impl/ActivityPricingEngine.java`, `ActivitySlotGenerator.java` and `ActivitySessionIds.java`.
  - `model/ActivityNotFoundException.java`, `ActivityConflictException.java` and `PricePreview.java`.
  - Tests: `ActivityPricingEngineTest`, `ActivitySlotGeneratorTest` and `ActivitySessionIdsTest` (45 tests).
- The full suite is now 110 tests, still failing only the baseline (6 failures and 5 errors in the `Tax*` classes).

**pms-ts** (branch `feature/activity_request_management`):
- `749d682` commits the plan (status promoted to `active`) and the planning handoff.
- The plan's Phases 0-2 checkboxes are ticked. That edit and this handoff are committed together after this handoff is written.

## Learnings

**Deviations from the plan** (all intentional; keep them):
- **`ActivitySession.sumPartySize`** (`model/ActivitySession.java`) uses `EnumSet.copyOf(...)`, not `List.of(...)`. `List.of(...).contains(null)` throws an NPE, which crashed `headcount()` for any request with a null status. The adapter test `sessionWithoutRequestsRoundTripsToAnEmptyMutableList` caught it.
- **`ActivityPricingEngine.unitPrice`** casts to `long` before multiplying. `int basePrice * 100` overflows above about 21M VND. `largeBasePriceDoesNotOverflow` covers this.
- **`ActivitySlotGenerator.slots()`** returns an empty list for an invalid config instead of throwing. Only `validate()` throws `IllegalArgumentException`. This keeps `listForStaff` (Phase 4) from blowing up on an activity with a bad stored config.
- **Unmatched tiers:** `ActivityPricingEngine` falls back to `defaultTiers()` when an activity's `pricingTiers` is null or empty at pricing time. Normally this can't happen, because `normalizeTiers` runs on save.
- **`ActivitySessionIds.parse`** uses STRICT `uuuuMMdd` / `HHmm` formatters and checks the length of each part. Impossible dates and times (month 13, 24:60) map to `ActivityNotFoundException("Session not found")`.
- **`ActivitySessionStore.countOpenByActivity`** uses `.maxResults(1).execute().count().value()`. The count is the total hit count, not the page size.

**Facts confirmed this session:**
- **Protostream enum names:** the generated `target/classes/proto/cache.proto` has the prefixed enum value names, and schema registration boots in the Spring context.
- **Query enum literals:** the indexed entities are Java class names (`vn.gofarmstay.model.ActivitySession`), so Ickle runs over Java objects. The queries therefore use the **Java** enum names (`'PENDING_CONFIRMATION','CONFIRMED'`), as `SInvoiceStoreImpl.java:71` does.
  - No test exercises the store queries; the repo has no Infinispan query tests.
  - They will first run for real in the Phase 3 manual delete check (`countOpenByActivity`) and in Phase 4. If the status filter there silently matches nothing, suspect this first.
- **Stores without listeners:** `AbstractIMDGStore` (`repository/imdg/impl/AbstractIMDGStore.java`) needs `registerListener()`. The activity stores only `log.info("No listeners registered for cache {}")`.
- **Test commands:**
  - Run the full suite with output redirected to a log, then grep it: `grep -E "<<< (FAILURE|ERROR)! -- in"` and the `Tests run:` summary line. The whole run takes about 4-5 minutes.
  - `mvn` exits non-zero because of the baseline. Judge the run by the list of failing classes, never by the exit code.
- **Don't overlap builds:** never run two `mvn` builds at once in vom-assistant. They share `target/` and the local RocksDB `data/` directory.
- **Committing:** always commit with explicit paths. `.run/AssistantApplication_LOCAL.run.xml` is still modified and unstaged, and must stay that way. Git's LF→CRLF warnings on new files are harmless.

**Working with the user:** at each phase the user does the manual check, then says to commit and continue. They approved committing per phase. Commit messages cite the plan path, and the first one also cites the planning handoff.

## Artifacts
- `thoughts/shared/plans/2026-09-30-activity-request-management.md`: the plan; status `active`, Phases 0-2 ticked.
- `thoughts/shared/handoffs/general/2026-10-01_00-34-31_activity-request-management-planning.md`: the planning handoff.
- `thoughts/shared/handoffs/general/2026-10-01_07-55-08_activity-request-management-phase-3-next.md`: this handoff.
- `C:\Users\kynzo\.claude\projects\C--apps-ps-pms-ts\memory\branch-before-changes.md`: the branching rule.

## Action Items & Next Steps
1. **Check the state:** both repos should be on `feature/activity_request_management`, and vom-assistant HEAD should be `71f1940`.
2. **Phase 3**, following the plan:
   - `service/ActivityService.java` and `service/impl/ActivityServiceImpl.java`.
   - `controller/ActivityController.java` (`/{tenant}/activity`).
   - `controller/ActivityExceptionHandler.java`, a scoped `@RestControllerAdvice(assignableTypes = ActivityController.class)`. It will be the first `@ControllerAdvice` in the repo.
   - An `Activity Management` block in `src/main/resources/application-security.yml`, after Rate Plan (which ends at line 252), with yml scopes `activity`, `activity:write`, `activity:create` and `activity:delete`.
   - The tests the plan lists, in the `TaxPolicyControllerTest` style (call methods directly, no MockMvc).
3. **Phase 3 checks:**
   - Run the targeted tests, then the full suite (no new failing classes).
   - Then ask the user to do the **manual Keycloak step**: resource `activity` with the plain scopes `write`, `create` and `delete`, mirroring `rate-plan`, and granted to the staff test user.
   - Then the manual curl checks.
   - Pause for the user's confirmation before committing.
4. **Phases 4-7** follow the plan, pausing after each one.
   - Phase 4 appends `,activity` to `application.yml:39` and adds `application-activity.yml`.
   - Phases 6-7 are in pms-ts. Its gates are `npx tsc --noEmit -p .` and `npm run build`.
5. **Phase 8** is the production release. It needs the devops repo, which is not on this machine.

## Other Notes
- `thoughts/searchable/` in pms-ts is untracked output from `hyprlayer thoughts sync`. Never commit it.
- The prior handoff's "Other Notes" (repo layout, vom-assistant new-domain recipe, pms-ts patterns, Tour references to remove) are still accurate. Phase 1 and 2 verification re-checked the anchors in `infinispan.xml`, `application-security.yml:223-252`, `application.yml:39` and `App.tsx`.
