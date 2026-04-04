# Project State: PMS (pms-ts)

**Project Name:** PMS (pms-ts)
**Current Phase:** Phase 4: Dynamic Room Integration
**Objective:** Replace all static room data with backend API calls.

## Recent Updates
- **Phase 4: Dynamic Room Integration (In Progress)**:
    - ✅ **Centralized Room API**: Established `src/db/room.ts` as the primary service.
    - ⏳ **Eliminate Static Room Data**: Auditing `src/db/invoice.ts` for removal of hardcoded rooms.

- **Phase 5: Advanced UX & Optimization (Planned)**:
    - ⏳ **Map Interactivity**: Move click-to-edit and tooltips here.
    - ⏳ **Advanced Filtering**: Move multi-criteria search here.

## Pending Tasks
- [ ] **Bugs**: [Fix the compile error](todos/01-bugs/fix-the-compile-error.md) (High Priority)

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
