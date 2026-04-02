# Architecture - PMS-TS (Property Management System)

## Patterns
- **React Functional Components with Hooks:** Modern React architecture leveraging `useState`, `useEffect`, and custom hooks for component lifecycle and state management.
- **Service-Repository Separation:** The project separates UI logic (in `src/Components/`) from data access logic (in `src/db/`). Files in `src/db/` act as data repositories, wrapping `axios` calls to backend services.
- **Feature-Oriented Components ("Managers"):** Large feature-level components (e.g., `InvoiceManager`, `OrderManager`, `RoomManager`) encapsulate all logic for a specific business domain, often acting as page containers.

## State Management
- **Lifted State:** Core application state, such as user profile, authentication status (`authorizedUserId`), and menu configuration, is maintained in the root `App.tsx` and passed down to child components via props (prop-drilling).
- **Local Component State:** Each "Manager" component maintains its own state for data fetching, filtering, and interactive UI elements using standard React `useState`.
- **No Global State Library:** The application does not use external state management libraries like Redux or MobX, nor does it use the React Context API for global state.

## Routing
- **React Router (v6):** Uses `react-router-dom` for client-side navigation.
- **Dynamic Routing:** Routes are statically defined in `App.tsx`, but visibility and navigation are dynamically controlled based on user roles and permissions.
- **Role-Based Access Control (RBAC):** Menu items and routes are filtered dynamically in `App.tsx` based on the `authorities` array returned from the user's profile.

## Authentication & Security
- **OIDC/OAuth2 Integration:** Authentication is handled externally via an OIDC provider. The application verifies login status by fetching a user profile from the backend.
- **JWT-based Identity:** Decodes identity information from user profile responses (e.g., using `jwt-decode` for profile attributes).
- **Backend API Correlation:** All data-fetching operations from `src/db/` are authenticated against the backend services.

## UI & Styling
- **Utility-First CSS:** Styled with **Tailwind CSS** for rapid and consistent design.
- **Component Library:** Leverages **Flowbite** and **Flowbite React** for pre-built UI components like buttons, modals, and input fields.
- **Responsive Layout:** Designed to work across different screen sizes, with a primary focus on homestay/resort management efficiency.
