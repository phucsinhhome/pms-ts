# Directory Structure - PMS-TS

## High-Level Tree
- **src/**: Root source directory containing all application source code.
    - **Components/**: Feature-specific "Manager" components and reusable UI components.
        - `*Manager.tsx`: Page-level containers for business domains (e.g., `InvoiceManager.tsx`, `RoomManager.tsx`).
        - `*Editor.tsx`: Specialized components for creating or editing entities (e.g., `OrderEditor.tsx`, `InvoiceEditor.tsx`).
        - `*Map.tsx`: Visualization components for entity relationships or geographical layouts.
    - **db/**: Data access layer and API client wrappers.
        - `apis.ts`: Base API configuration and shared HTTP logic.
        - `[domain].ts`: Domain-specific API repositories (e.g., `invoice.ts`, `reservation.ts`, `inventory.ts`).
    - **Service/**: Utility functions and specialized service integrations.
        - `FileMinio.ts`: Integration logic for Minio/S3-compatible object storage.
        - `Utils.ts`: Common helper functions for data formatting, calculation, and UI state.
    - `App.tsx`: Main application component; manages global state, routing, authentication, and core layout.
    - `index.tsx`: Application entry point; initializes React and `BrowserRouter`.
- **public/**: Static assets that are copied directly to the build directory.
    - `lotus.png`, `favicon.ico`: Application branding and icons.
    - `manifest.json`: Web app manifest for PWA capabilities.
    - `index.html`: The HTML template for the SPA.
- **.planning/**: Documentation and planning resources for the project.
    - **codebase/**: Architectural and structural documentation (e.g., `ARCHITECTURE.md`, `STRUCTURE.md`).
- **package.json**: Project dependencies, scripts, and metadata.
- **tailwind.config.js**: Configuration for Tailwind CSS utility styles.
- **tsconfig.json**: TypeScript compiler configuration and path aliases.
