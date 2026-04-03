# Requirements: PMS Improvement

## Functional Requirements
- **Order-Invoice Integration:** Automated or seamless linking of invoices to orders (e.g., in `OrderEditor`).
- **Tour Management:** Persist changes to tours via `handleSave` in `TourEditor`.
- **Dynamic Maps:** Real-time fetching of room names/data for `ReservationMap` and `InvoiceMap`.
- **Advanced Filtering & Search:** Improved capabilities for managing large lists of invoices and reservations.
- **Improved Room/Rate Management:** Enhanced UI for managing rates and room configurations.

## Non-Functional Requirements
- **Responsive & Modern UI:** Optimized for desktop and tablets using Tailwind CSS and Flowbite.
- **Performance:** Fast loading and efficient rendering of large data sets (e.g., invoice grids).
- **Maintainability:** Clear separation of concerns, TypeScript-typed APIs, and reusable components.
- **Data Integrity:** Robust error handling and validation for all data persistence actions.

## User Stories
- As an operator, I want to easily see which rooms are occupied and by whom on a map view.
- As an administrator, I want to manage guest orders and ensure they are correctly linked to invoices.
- As a manager, I want accurate profit reports based on real-time invoice and expense data.
- As a developer, I want a clean and well-documented codebase for future features like AI-assisted tasks.

## Success Criteria
- [ ] Order-Invoice persistence is verified in `OrderEditor`.
- [ ] Tour management changes are saved successfully to the backend.
- [ ] Maps (`ReservationMap`, `InvoiceMap`) use dynamic room data from the database.
- [ ] UI reflects a modern and professional aesthetic suitable for a PMS.
- [ ] All API interactions include proper error handling and feedback to the user.
