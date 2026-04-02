# Coding Conventions - pms-ts

This document outlines the coding standards, project structure, and architectural rules for the PMS project.

## 1. Naming Conventions

### 1.1 Files and Directories
- **React Components**: `PascalCase.tsx` (e.g., `InvoiceEditor.tsx`, `ReservationManager.tsx`).
- **Services/Utilities**: `PascalCase.ts` (e.g., `FileMinio.ts`, `Utils.ts`).
- **Database/API Logic**: Mix of `snake_case.ts` and `kebab-case.ts` (e.g., `rate_plan.ts`, `tour-request.ts`).
- **Styles**: `App.css`, `index.css` (Lower camelCase or standard CSS file names).
- **Directories**: `PascalCase` for `Components`, `lowercase` for `db`, `Service`.

### 1.2 Symbols
- **Component Names**: `PascalCase`.
- **Functions and Variables**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`).
- **Types and Interfaces**: `PascalCase` (e.g., `Chat`, `UploadedObject`).

## 2. Formatting and Linting

### 2.1 Formatting
- **Prettier**: Configured with `prettier-plugin-tailwindcss` for consistent Tailwind utility class ordering.
- **Indent**: 2 spaces (standard for React projects).
- **Quotes**: Single quotes for strings, double quotes for JSX attributes.

### 2.2 Linting
- **ESLint**: Extends `react-app` and `react-app/jest`.
- **TailwindCSS**: Used for all styling; avoid inline styles where possible.

## 3. Architectural Rules

### 3.1 Component Structure
- Components are largely monolithic but organized into the `Components/` directory by domain.
- Functional components with React Hooks (`useState`, `useEffect`) are preferred.
- Props should be typed using TypeScript interfaces or types.

### 3.2 Data Management
- **API Calls**: Managed in the `db/` directory using `axios`.
- **Axios Instances**: Exported from `db/apis.ts` with base URLs pointing to different microservices.
- **State Management**: Local component state (`useState`) is used; no global state manager like Redux or MobX is currently implemented.

### 3.3 Multi-tenancy and Authorization
- **Tenant Context**: Managed via `tenantId` extracted from the user profile.
- **Authorization**: Based on `roles` and `authorities` provided in the OIDC user profile.

### 3.4 Configuration
- Environment variables (`REACT_APP_*`) are used for all endpoint configurations and constants.
- Access via `process.env`.

## 4. Directory Structure
- `src/Components/`: UI logic and React components.
- `src/db/`: API definitions and data access logic.
- `src/Service/`: Shared business logic and utilities.
- `public/`: Static assets (images, icons).
