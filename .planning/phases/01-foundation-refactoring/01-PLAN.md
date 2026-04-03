## Phase 1: Foundation & Refactoring

### Task 1: Type Refactoring & Config Expansion
- Move `PaymentMethod` type from `src/Components/InvoiceEditor.tsx` to `src/db/configs.ts`.
- Update `AppConfig` interface in `src/db/configs.ts` to include:
  ```typescript
  invoice: {
    paymentMethods: PaymentMethod[]
  }
  ```
- Update `defaultAppConfigs` in `src/db/configs.ts` to include static fallbacks for `paymentMethods` using data from `src/db/staticdata.ts`.

### Task 2: Root Config Distribution
- Update `App.tsx` to pass the `configs` state to `InvoiceEditor` component within the `Routes`.
- Ensure `InvoiceEditor` receives the `configs` prop consistently with other manager components (like `OrderManager`).

### Task 3: Dynamic InvoiceEditor Refactoring
- Update `InvoiceEditor` component to accept `configs?: AppConfig` in its props.
- Refactor `InvoiceEditor` to use `paymentMethods` from `props.configs?.invoice?.paymentMethods` with a fallback to `staticdata.ts` if the config is not yet loaded.
- Update internal state management (e.g., `selectedPaymentMethod`) to initialize correctly from dynamic config.
- Verify that the "new" invoice creation flow (which fetches reservations) remains functional.

### Task 4: API Factory Consolidation
- Refactor `src/db/apis.ts` to implement a factory function (e.g., `createApiInstance`) for creating Axios instances.
- Consolidate common configuration (like `withCredentials: true`) into the factory to reduce redundancy across the file.

### Task 5: Map Verification
- Verify if `RoomManager.tsx` (Reservation Map) and `InvoiceMap.tsx` are correctly fetching and displaying room data.
- Assess if hardcoded `ROOM_NAMES` and `ROOM_MAP` should be moved to dynamic configuration in this phase or a subsequent one.

### Verification
#### Automated Tests
- No automated tests currently exist for these components; rely on manual verification.

#### Manual Verification
- **Config Loading**: Verify in DevTools that `app.json` is fetched and `InvoiceEditor` uses the remote payment methods.
- **Invoice Creation**: Test creating a "new" invoice from a reservation and ensure all fields populate correctly.
- **Payment Selection**: Open the payment modal in `InvoiceEditor` and verify icons and rates match the configuration.
- **API Connectivity**: Verify that all refactored API instances in `apis.ts` still communicate correctly with their respective microservices.
- **Map View**: Confirm `InvoiceMap` and `RoomManager` display current occupancy data based on the selected date.
