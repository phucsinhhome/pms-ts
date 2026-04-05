# Project State: PMS (pms-ts)

**Project Name:** PMS (pms-ts)
**Current Phase:** Phase 5: Advanced UX & Optimization
**Objective:** Enhance map interactivity, tooltips, and advanced filtering.
## Recent Updates
- **Quick Task (COMPLETED)**: Renamed `src/db/room.tsx` to `src/db/room.ts` since it no longer contains JSX.
- **Quick Task (COMPLETED)**: Fixed room pre-selection in `InvoiceEditor` by correcting `internalName` mapping in `chooseRoom`.
- **Phase 4: Dynamic Room Integration (COMPLETED)**:
...
    - ✅ **Centralized Room API**: Refactored `src/db/room.tsx` with dynamic data source.
    - ✅ **Vertical Room Selection**: Updated `InvoiceEditor.tsx` modal for better mobile/UX.
    - ✅ **Static Data Removal**: Deleted `src/db/staticdata.ts` and cleaned up `src/db/invoice.ts`.
    - ✅ **Unified Icons**: Removed redundant `roomIcons` mapping and standardized on single `GiHouse` icon for simplified maintenance.
    - ✅ **ID-Based Logic**: Ensured `internalName` is used consistently for room identification.

- **Phase 5: Advanced UX & Optimization (In Progress)**:
    - ⏳ **Map Interactivity**: Add click-to-edit and detailed tooltips for reservations.
    - ⏳ **Advanced Filtering**: Implement multi-criteria search in Invoice/Reservation managers.


## Pending Tasks
- [x] **Bugs**: [Fix the compile error](todos/01-bugs/fix-the-compile-error.md) (Completed)

- **Phase 2: Configuration Caching & Resilience (COMPLETED)**:
    - ✅ **Cache-First Strategy**: Implemented in `src/db/configs.ts` using `localStorage` for near-instant loads.
    - ✅ **Background Refresh**: Added non-blocking remote fetch to update cache for the next session.
    - ✅ **Async Retry Mechanism**: Robust 3-retry logic for initial configuration fetch.
    - ✅ **Versioning**: Added `version` field to `AppConfig` to avoid redundant cache updates.
    - ✅ **Race Condition Fix**: Refactored `App.tsx` with separate loading states for Profile and Config, ensuring no renders occur with undefined configuration.
    - ✅ **Bug Fixes**: Resolved TypeScript compilation errors in `RoomManager.tsx`.

- **Phase 6: Room Manager Optimization (COMPLETED)**:
    - ✅ **ID-Based Mapping**: Refactored `ReservationMap.tsx` to use room IDs for reliable data matching.
    - ✅ **Room CRUD**: Transformed `RoomManager.tsx` into a dedicated room management interface with create/update/delete functionality using Modals.
    - ✅ **Property Alignment**: Renamed `internalRoomName` to `internalName` across all components (`Room` and `ResRoom` types) to match backend data and fix UI display issues.
    - ✅ **API Expansion**: Added `createRoom`, `updateRoom`, and `deleteRoom` to `src/db/room.ts`.
    - ✅ **Lifecycle Optimization**: Optimized fetching and state management in both room-related components.

- **Phase 1: Foundation & Refactoring (COMPLETED)**:
... (rest of the file)
