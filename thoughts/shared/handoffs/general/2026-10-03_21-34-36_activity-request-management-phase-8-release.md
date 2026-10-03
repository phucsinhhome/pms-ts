---
title: "general: Activity Request Management Phases 0-7 done, Phase 8 (production release) next"
type: handoff
date: 2026-10-03
status: active
project: pms-ts
scope: shared
author: Minh Trần
ticket: null
tags: [activity, booking, vom-assistant, pms-ts, devops, release]
related: [thoughts/shared/plans/2026-09-30-activity-request-management.md, thoughts/shared/handoffs/general/2026-10-01_07-55-08_activity-request-management-phase-3-next.md, thoughts/shared/handoffs/general/2026-10-01_00-34-31_activity-request-management-planning.md, thoughts/shared/plans/2026-09-27-order-push-notifications.md]
researcher: Minh Trần
git_commit: 50504bfdab691fd5007cac86a6e7ab7013142970
branch: feature/activity_request_management
repository: pms-ts
topic: "Activity Request Management Implementation Strategy"
last_updated: 2026-10-03
last_updated_by: Minh Trần
body_type: implementation_strategy
---

# Handoff: general, Activity Request Management (Phases 0-7 done, Phase 8 next)

## Task(s)

The task is to implement `thoughts/shared/plans/2026-09-30-activity-request-management.md` (status `active`, Phases 0-8). This session resumed from `2026-10-01_07-55-08_activity-request-management-phase-3-next.md`.

1. **Phases 0-2:** completed in earlier sessions.
2. **Phase 3, activity admin API:** completed. vom-assistant `586ae67`.
3. **Phase 4, staff session operations, CAS and scheduler:** completed. vom-assistant `92b6650`.
4. **Phase 5, guest API under reception:** completed. vom-assistant `d758ee9`.
5. **Phase 6, Tour replaced by Activity in pms-ts:** completed. pms-ts `9ffbc18`.
6. **Phase 7, Sessions screen in pms-ts:** completed. pms-ts `50504bf`.
7. **Phase 8, production release: not started. This is next.** It needs the **devops** repo, which is **not on this machine**, plus manual Keycloak and Netlify work.

The user did every phase's manual checks and approved each one. Every automated and manual checkbox for Phases 0-7 is ticked in the plan. Phase 8's boxes are all still open. No PRs have been opened and nothing is merged to `develop`.

## Critical References
- `thoughts/shared/plans/2026-09-30-activity-request-management.md` is the source of truth. Phase 8 is at `## Phase 8: Production Release` (around line 975). The Keycloak steps are under `## Migration Notes`, and the rollback is there too.
- `thoughts/shared/plans/2026-09-27-order-push-notifications.md` (Phase 4, around lines 440-475) is the earlier release Phase 8 copies: devops `infinispan.xml`, `ps.yml`, Netlify.

## Recent changes

All of these are pushed to `origin/feature/activity_request_management` in each repo.

**vom-assistant** (on top of `de057c4`; `.run/AssistantApplication_LOCAL.run.xml` is still modified and unstaged, and must stay that way):
- **`586ae67` (Phase 3):**
  - `service/ActivityService.java`, `service/impl/ActivityServiceImpl.java`
  - `controller/ActivityController.java`
  - `controller/ActivityExceptionHandler.java`: the repo's first `@RestControllerAdvice`, scoped with `assignableTypes`
  - an `Activity Management` block in `application-security.yml`, after Rate Plan
- **`92b6650` (Phase 4):**
  - `service/ActivitySessionService.java`, `service/impl/ActivitySessionServiceImpl.java`
  - `controller/ActivitySessionController.java`
  - `scheduler/ActivitySessionScheduler.java`
  - `properties/ActivityProperties.java`, `config/ActivityConfiguration.java`
  - models: `ActivitySessionView`, `ActivityRequestInput`, `CapacityInput`, `HostInput`
  - config: `application-activity.yml`, and `,activity` appended to `application.yml:39`
- **`d758ee9` (Phase 5):**
  - `model/GuestStay.java`, `service/impl/ActivityGuestResolver.java`, `controller/ActivityReceptionAPI.java`
  - `listForGuest` in the session service, and `ActivitySessionView.forGuest(invoiceId)`
- **Full suite:** 193 tests. It fails only the baseline, the 5 `Tax*` classes with 6 failures and 5 errors. `TelegramBotApplicationTests` passes, so the caches, schema, `activity` profile and scheduler cron setting all start.

**pms-ts:**
- **`a2c3a1a`:** stopped tracking `thoughts/searchable/`, which `48afc33` had committed by mistake, and added it to `.gitignore`. The files stay in history at `48afc33`.
- **`9ffbc18` (Phase 6):**
  - deleted the four Tour files
  - `activityApi` in `src/db/apis.ts`
  - `REACT_APP_ACTIVITY_ENDPOINT` in `.env.development`. This file is tracked even though `.gitignore` lists it.
  - `src/db/activity.ts`, `src/Components/ActivityManager.tsx` (which exports `useStaffUsers` and `HostPicker`)
  - the Activity menu and route in `src/App.tsx`
- **`50504bf` (Phase 7):** `src/Components/ActivitySessions.tsx`, the `activity/sessions` route, the Sessions buttons in `ActivityManager`, and session calls in `db/activity.ts`.
- **Plan ticks:** `2ef8f77`, `dfbaa85` and `5de7751` record Phases 3-5. The Phase 6 and 7 ticks are in those phases' commits.
- **Gates:** `npx tsc --noEmit -p .` and `npm run build` pass. The only build warnings are flowbite-react source maps.

## Learnings

**Phase 8 traps** (from the plan and the planning handoff; all still apply):
- **Production cache config:** production mounts a **separate** `devops/docker-swarm/config/assistant/infinispan.xml` that uses the **`urn:infinispan:config:store:rocksdb:14.0`** namespace. Local `infinispan.xml` uses 15.0.
  - Copy the two blocks from vom-assistant's `src/main/resources/infinispan.xml`, the `activities` and `activity-sessions` caches after `immigration-registrations`, but change the namespace to 14.0.
  - Keep the plan's lifespans, not that file's 60-day default: `activities` uses `lifespan="-1"`, and `activity-sessions` uses `31536000000` with `interval="-1"`.
  - Keep `<encoding media-type="application/x-protostream"/>` on `activity-sessions`. The CAS `replace(k, old, new)` compares serialized bytes.
  - A missing cache stops the backend from starting (`AbstractIMDGStore.loadCache()`), so the XML must be deployed **before or with** the new image.
- **Keycloak scope names:** they must be **plain** `write`, `create` and `delete` on resource `activity`. Authorities are built as `rsname` and `rsname:scope` (`SecurityConfiguration.java:111-121`).
  - Copy the policies the `rate-plan` permissions use.
  - The user did this already in `ps_dev`. It still needs doing in the **production realm**.
- **Netlify:** production pms-ts is built by Netlify, not the Dockerfile.
  - Set `REACT_APP_ACTIVITY_ENDPOINT=https://<prod-host>/assistant/{tenant}/activity` on **both** sites, `pmsdr-ps` and `pmsts-ps`.
  - Use the same host as each site's `REACT_APP_RATE_PLAN_ENDPOINT`, then run "Clear cache and deploy".
  - If the variable is missing, every Activity call fails.
- **Backend environment:** no new variables are needed. `ACTIVITY_SESSION_CRON_ENABLED` (default `true`) and `ACTIVITY_SESSION_CRON` (default `0 */15 * * * *`) are optional overrides.
- **Rollback:** revert the devops XML and the image tag in the **same** `docker stack deploy`, so the old image never starts with cache definitions for classes it lacks.

**Deviations from the plan made this session** (all intentional; recorded in the commit messages):
- **Version on a copy (Phase 4):** `ActivitySessionServiceImpl.mutate` sets the version on a `toBuilder()` copy of what `change` returns, not with `setVersion`. That way the object the cache compares against is never modified in place.
- **Deleted activity on completion (Phase 4):** `complete` on a session whose activity was deleted still completes it, but leaves `lockedUnitPrice` null with a warning. Otherwise the sweep would retry it forever.
- **Sweep errors (Phase 4):** `closeEndedSessions` logs and skips `ActivityNotFoundException` as well as `ActivityConflictException`.
- **Small additions:**
  - staff-added requests require a guest name (400);
  - guests get 409 "Session has already started" after the start time;
  - a list request whose end date is before its start date gets 400;
  - the guest list also includes stored sessions that no longer match a slot, if they are still open and in the future (the staff list does the same);
  - the guest name comes from the invoice, so it can be null.

**Working rules confirmed this session:**
- **Commits:** always commit with explicit paths in vom-assistant; never `git add -A`.
- **Line endings:** the pms-ts blobs are stored with **CRLF** (`core.autocrlf=true`). An earlier Python edit in this session wrote LF and turned every line into a diff. It was fixed by converting back. Edit with the Edit tool, or keep CRLF. Note that Git Bash `grep $'\r$'` doesn't detect CR; use `od -c`.
- **Test runs:** run the full vom-assistant suite with output redirected to a log, then grep `<<< (FAILURE|ERROR)! -- in`. `mvn` exits 1 because of the baseline.
- **Process:** the user approves each phase after their manual check, then says to commit and push. Commit messages cite the plan path.

## Artifacts
- `thoughts/shared/plans/2026-09-30-activity-request-management.md`: the plan; Phases 0-7 ticked, Phase 8 open.
- `thoughts/shared/handoffs/general/2026-10-01_00-34-31_activity-request-management-planning.md`: user decisions and the traps the reviews caught.
- `thoughts/shared/handoffs/general/2026-10-01_07-55-08_activity-request-management-phase-3-next.md`: the previous handoff.
- `thoughts/shared/handoffs/general/2026-10-03_21-34-36_activity-request-management-phase-8-release.md`: this handoff.
- `thoughts/shared/plans/2026-09-27-order-push-notifications.md`: the earlier release that Phase 8 copies.
- `C:\Users\kynzo\.claude\projects\C--apps-ps-pms-ts\memory\branch-before-changes.md`: the rule to branch before changing anything.

## Action Items & Next Steps
1. **Check the state:**
   - Both repos are on `feature/activity_request_management`, level with `origin`.
   - vom-assistant HEAD is `d758ee9`.
   - pms-ts HEAD is this handoff's commit, on top of `50504bf`.
2. **Get the devops repo** onto the machine, or have the user apply the edits there. Create `feature/activity_request_management` off `develop` in it first, as the branching rule requires.
3. **Release in this order** (plan §Phase 8, "5. Release order"):
   1. **vom-assistant:** open a PR, merge to `develop`, bump the version, tag and push. Build and publish the image.
   2. **devops:**
      - add both caches to `docker-swarm/config/assistant/infinispan.xml` (rocksdb 14.0 namespace, the plan's lifespans);
      - set `assistant.image` in `docker-swarm/stack/ps.yml` to the new tag;
      - commit and push, copy the XML to `/opt/devops/docker-swarm/config/assistant/` on the server, pull, and run `docker stack deploy -c stack/ps.yml ps`.
   3. **Keycloak, production realm:** create the `activity` resource with scopes `write`, `create` and `delete`, and permissions copied from `rate-plan`.
   4. **pms-ts:** set the Netlify variable on both sites. Then open a PR, merge to `develop`, bump the version, tag and push, and Netlify deploys.
4. **Automated checks, run in the devops checkout:**
   - `grep -cE 'name="(activities|activity-sessions)"' docker-swarm/config/assistant/infinispan.xml` prints `2`;
   - `docker compose -f docker-swarm/stack/ps.yml config -q` succeeds.
5. **Manual checks:**
   - the production `assistant` logs show both caches starting with no schema errors;
   - a staff user with `activity` sees the menu, can create an activity, and sees its slots under Sessions;
   - Room, Rate Plan, Order and Invoice still work.
6. **Finish up:** tick the Phase 8 boxes, then promote the plan's `status` from `active` to `implemented` (`/validate_plan` does this).

## Other Notes
- **PRs:** none are open. `/describe_pr` follows the repo template if the user wants PR bodies.
- **Branches:** the main branch is `main`, and features merge into `develop`.
- **GitHub alerts:** pushing to vom-assistant prints 3 Dependabot alerts (1 critical, 1 high, 1 moderate) on its default branch. They're unrelated to this feature and haven't been looked into.
- **Out of scope:** viorder, the guest app at `C:\apps\ps\viorder`, has no UI for the new guest API. The tour pages there still call the old, unconfigured service.
- **Don't commit:** `thoughts/searchable/` is now ignored. Don't re-add it.
