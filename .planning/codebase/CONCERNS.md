# PMS-TS: Areas of Concern & Technical Debt

This document outlines the identified technical debt, security risks, potential bottlenecks, and missing features in the `pms-ts` project.

## 1. Technical Debt

### 1.1 Over-usage of `any`
The codebase makes extensive use of the `any` type in TypeScript, particularly in core components like `InvoiceEditor.tsx`, `ReservationManager.tsx`, and `App.tsx`.
- **Impact:** Negates the benefits of TypeScript, increases the risk of runtime errors, and provides poor IDE support for developers.
- **Location:** Throughout `src/Components/` and `src/db/`.

### 1.2 Monolithic Components
Several components are excessively large and handle too many responsibilities.
- **`InvoiceEditor.tsx`:** Over 2,100 lines of code. It handles state management for dozens of modals, complex business logic for invoice generation, and intricate UI rendering.
- **`App.tsx`:** Manages authentication, routing, and menu filtering in a single large component.
- **Impact:** Extremely difficult to maintain, test, and debug. High cognitive load for developers.

### 1.3 Hardcoded Business Data
Static data that should typically be managed in a database or through an administrative API is hardcoded in the frontend.
- **Room Rates:** Hardcoded in `src/db/staticdata.ts`.
- **Payment Methods:** Hardcoded in `src/db/staticdata.ts`.
- **User List:** Hardcoded in `src/db/users.ts`.
- **Impact:** Any change in pricing, staff, or payment options requires a code change and redeployment.

### 1.4 Absence of Automated Tests
There are zero automated tests (unit, integration, or end-to-end) in the `pms-ts` directory.
- **Impact:** High risk of regressions when making changes. No automated way to verify business logic correctness.

### 1.5 State Management
The application lacks a centralized state management solution (e.g., Redux, Zustand, or React Context).
- **Impact:** Heavy "prop-drilling" and complex local states in large components, making state transitions hard to track and leading to potential performance issues.

### 1.6 SPA Anti-patterns
The application uses direct `window.location.href` manipulation for authentication (login/logout) and some navigation.
- **Impact:** Breaks the Single Page Application (SPA) flow, resets the application state unnecessarily, and makes the UI feel less fluid.

### 1.7 Dependency Version Mismatches
`package.json` shows a mismatch between `react` (v18.1.0) and `@types/react` (v19.0.2).
- **Impact:** Potential type errors and subtle runtime bugs due to incompatible type definitions.

---

## 2. Security Risks

### 2.1 Hardcoded API Keys
Google Firebase credentials, including the API key, are hardcoded directly in the source code.
- **Location:** `src/db/configs.ts`.
- **Risk:** Exposure of infrastructure credentials if the code is compromised or accidentally shared.

### 2.2 Plaintext Credentials in `.env`
Sensitive keys for the file service are stored in plaintext in the `.env` file.
- **Keys:** `REACT_APP_FILE_SERVICE_ACCESS_KEY` and `REACT_APP_FILE_SERVICE_SECRET_KEY`.
- **Risk:** Unauthorized access to object storage if environment files are exposed.

### 2.3 Fragile Authentication Logic
The application determines if a user is unauthorized by checking if the response URL was redirected to the login page (`rsp.request.responseURL === AUTH_URL`).
- **Location:** `App.tsx`, `fetchUserProfile`.
- **Risk:** Fragile logic that can easily break with backend changes. Proper 401/403 status code handling should be used instead.

### 2.4 Commented-out Auth Interceptors
Several Axios interceptors designed to handle access tokens are commented out in `src/db/apis.ts`.
- **Risk:** Inconsistent authentication across different services; potential for making unauthorized requests.

---

## 3. Potential Bottlenecks

### 3.1 Rendering Performance
Large components like `InvoiceEditor` render many complex modals and tables. Without proper optimization (e.g., `React.memo`, `useMemo`), frequent state updates can lead to UI lag.

### 3.2 Unbounded API Requests
Some API calls use hardcoded large page sizes (e.g., `size: 100` in `listAllProductItems`).
- **Risk:** Performance degradation on both frontend and backend as the number of products or invoices grows.

---

## 4. Missing Features

### 4.1 Input Validation
There is minimal robust client-side validation for complex forms. Most logic relies on basic null checks or backend validation.

### 4.2 Error Boundaries & Logging
The application lacks global error boundaries to prevent the entire UI from crashing on component errors. There is also no evidence of a centralized logging system for production monitoring.

### 4.3 UI/UX Polish
- **Loading States:** Inconsistent loading indicators across different modules.
- **Direct Navigation:** Lack of deep linking for all modal-driven actions.
