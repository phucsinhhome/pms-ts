# Roadmap: PMS Improvement

## Phase 1: Foundation & Refactoring (COMPLETED)
- **Implement Dynamic Data Fetching:** Replace hardcoded room names in maps with dynamic data from the database.
- **Set Up UI Component Library Extensions:** Integrate more Flowbite and custom components for improved UI consistency.
- **Refactor Shared Services:** Centralize utility functions and API service patterns across different modules.

## Phase 2: Configuration Caching & Resilience (COMPLETED)
- **Local Storage Caching:** Implement local storage caching for the global `app.json` configuration to improve load times and offline resilience.
- **Configuration Versioning:** Add basic versioning or timestamp checks to ensure the cache is invalidated when remote config updates.
- **Improved Loading UX:** Refine the splash screen or loading states during configuration resolution.

## Phase 3: Feature Completion & Persistence (COMPLETED)
- **Enhance Order-Invoice Linking:** Implement backend persistence for linking invoices to orders in `OrderEditor`.
- **Tour Management Save Feature:** Implement and test the `handleSave` function in `TourEditor`.
- **Improved Rate Plan Management:** Refine the UI for managing room rates and occupancy.

## Phase 4: Dynamic Room Integration (COMPLETED)
- **Eliminate Static Room Data:** Replace all hardcoded room arrays and static lists (e.g., `getItemList` in `invoice.ts`) with backend API calls.
- **Centralize Room Source of Truth:** Ensure `InvoiceEditor`, `ReservationMap`, and `InvoiceMap` use the same dynamic `Room` service.
- **API Data Mapping:** Ensure room IDs and internal names match across all data extraction and display logic.

## Phase 6: Room Manager and Invoice Map Optimization (COMPLETED)
- **Refactor Room/Invoice Mapping**: Switch to ID-based matching to ensure data integrity.
- **Improved Visualization**: Enhance Room Manager and Invoice Map views to correctly show room status.
- **Performance & Lifecycle Fixes**: Optimize state management and component rendering.

## Phase 5: Advanced UX & Optimization (Current)
- **Interactive Map Enhancements:** Add click-to-edit, tooltips, and quick actions to reservation/invoice maps.
- **Advanced Filtering for Invoices/Reservations:** Implement multi-criteria search (Guest Name, Status, Room, Channel).
- **Performance Optimization:** Optimize large list rendering and map lifecycle management.

## Future Phases
- **Mobile Companion App:** Lightweight mobile version for staff members.
- **Reporting Dashboard:** Comprehensive visual analytics for revenue, occupancy, and guest behavior.
- **Multi-tenant Support:** Finalize the backend multi-tenancy architecture on the frontend.
