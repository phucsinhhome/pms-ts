# Project State: PMS (pms-ts)

**Project Name:** PMS (pms-ts)
**Current Phase:** Phase 4: Advanced UX & Optimization
**Objective:** Enhance map interactivity and implement advanced filtering.

## Recent Updates
- **Phase 4: Advanced UX & Optimization (In Progress)**:
    - ✅ **Room Management Improvement**: Refactored `Room` type into `src/db/room.ts` for centralization.
    - ✅ **Enhanced Room UI**: Added `status` (ACTIVE/INACTIVE), `maxAdults`, and `numDoubleBeds` visualization with icons in `RoomManager`. All properties are now editable via the Room Modal.
    - ✅ **Search Functionality**: Implemented search/filter by name and internal name in `RoomManager`.
    - ✅ **Mobile Card Layout**: Implemented a responsive card-based list for mobile devices while retaining the table view for desktop.
    - ✅ **UI Cleanup**: Removed unnecessary `room.id` from the list view to reduce clutter.
    - ✅ **Code Refactoring**: Updated all components to import `Room` from centralized database module.

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
