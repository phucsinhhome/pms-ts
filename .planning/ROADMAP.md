# Roadmap: PMS Improvement

## Phase 1: Foundation & Refactoring (COMPLETED)
- **Implement Dynamic Data Fetching:** Replace hardcoded room names in maps with dynamic data from the database.
- **Set Up UI Component Library Extensions:** Integrate more Flowbite and custom components for improved UI consistency.
- **Refactor Shared Services:** Centralize utility functions and API service patterns across different modules.

## Phase 2: Configuration Caching & Resilience (Current)
- **Local Storage Caching:** Implement local storage caching for the global `app.json` configuration to improve load times and offline resilience.
- **Configuration Versioning:** Add basic versioning or timestamp checks to ensure the cache is invalidated when remote config updates.
- **Improved Loading UX:** Refine the splash screen or loading states during configuration resolution.

## Phase 3: Feature Completion & Persistence
- **Enhance Order-Invoice Linking:** Implement backend persistence for linking invoices to orders in `OrderEditor`.
- **Tour Management Save Feature:** Implement and test the `handleSave` function in `TourEditor`.
- **Improved Rate Plan Management:** Refine the UI for managing room rates and occupancy.

## Phase 4: Advanced UX & Optimization
- **Interactive Map Enhancements:** Add more interactivity and detail to reservation/invoice maps.
- **Advanced Filtering for Invoices/Reservations:** Implement sophisticated filtering and search in grids.
- **Performance Optimization:** Optimize the rendering of large lists and map data.

## Phase 5: Integrations & AI Features
- **MinIO Integration:** Finalize document and receipt handling with object storage.
- **Google Generative AI Integration:** Implement AI-assisted tasks (e.g., invoice classification, automated guest replies).
- **Firebase Real-time Features:** Enhance real-time status updates for room occupancy.

## Future Phases
- **Mobile Companion App:** Lightweight mobile version for staff members.
- **Reporting Dashboard:** Comprehensive visual analytics for revenue, occupancy, and guest behavior.
- **Multi-tenant Support:** Finalize the backend multi-tenancy architecture on the frontend.
