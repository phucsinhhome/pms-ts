# Project State: PMS (pms-ts)

**Project Name:** PMS (pms-ts)
**Current Phase:** Phase 2: Feature Completion & Persistence (PLANNED)
**Objective:** Enhance order-invoice linking and implement persistence for tour management.

## Recent Updates
- **Phase 1: Foundation & Refactoring (COMPLETED)**:
    - ✅ **Dynamic Configuration**: Successfully refactored `AppConfig` and `InvoiceEditor` to use remote `paymentMethods` with static fallbacks.
    - ✅ **API Factory**: Consolidated `src/db/apis.ts` into a factory-based structure, reducing redundancy.
    - ✅ **Dynamic Room Maps**: Refactored `RoomManager.tsx` (Reservation Map) and `InvoiceMap.tsx` to fetch room data dynamically from the database via `src/db/room.ts`.
    - ✅ **Root Config Distribution**: Updated `App.tsx` to distribute global configuration to child components.
    - ✅ **Consolidated Configuration**: Removed redundant `paymentMethods` from `staticdata.ts` and updated `InvoiceEditor` to use `defaultAppConfigs` as the primary fallback.

## Known Issues & Debt
- **Microservices Complexity**: Managing multiple Axios instances for different domains can lead to redundancy in API logic (partially addressed by API factory).
- **Inconsistent Error Handling**: Ensure all user-facing actions have unified error reporting and feedback.
- **Tour Persistence**: Need to verify if backend supports the `handleSave` logic in `TourEditor`.

## Next Steps (Phase 2)
- Implement backend persistence for linking invoices to orders.
- Finalize and test the `handleSave` function in `TourEditor`.
- Refine the UI for `RatePlanManager`.
