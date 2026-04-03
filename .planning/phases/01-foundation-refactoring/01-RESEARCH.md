# 01-RESEARCH.md: Foundation & Refactoring

## Standard Stack
- **HTTP Client**: Axios (standardized across all services).
- **UI Components**: `flowbite-react` for Modals, Buttons, and Datepickers.
- **State Management**: React `useState` and `useEffect` for local component state; potentially a context provider for global `AppConfig`.
- **Icons**: `react-icons/hi`, `react-icons/fa`, `react-icons/io`, `react-icons/md`.

## Architecture Patterns
- **Configuration Provider**: Implement a pattern to fetch and distribute `AppConfig` globally via `App.tsx` and props/context.
- **Factory Pattern for APIs**: Consolidate multiple `axios.create` calls in `src/db/apis.ts` into a single factory or shared base instance.
- **Data-Driven UI**: Replace all hardcoded arrays (rooms, payment methods) with state derived from APIs.
- **Fallback Pattern**: Always implement a static fallback (e.g., `src/db/staticdata.ts`) in case remote configuration or API calls fail.

## Don't Hand-Roll
- **Modal Logic**: Use Flowbite `Modal` instead of custom overlays.
- **Date Picking**: Use Flowbite `Datepicker` for consistent UX.
- **API Instances**: Do not manually configure every axios instance; use a shared interceptor for `withCredentials` and authorization.

## Common Pitfalls
- **Breaking existing invoice creation**: Refactoring `paymentMethods` must not break the logic for creating "new" invoices.
- **Async config loading**: Components using dynamic config must handle the `undefined` state before the fetch completes.
- **Type safety**: Ensure `AppConfig` reflects the exact structure of the remote `app.json`.

## Code Examples
- **Updated AppConfig**:
  ```typescript
  export type AppConfig = {
      app: { showProfile: boolean },
      users: Chat[],
      invoice: { paymentMethods: PaymentMethod[] },
      orderManagement: { ... }
  }
  ```
- **Dynamic Payment Method Selection**:
  ```typescript
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
      props.configs?.invoice?.paymentMethods[0] || paymentMethods[0]
  );
  ```

## RESEARCH COMPLETE
Research for Phase 1 is finalized, providing a clear path for dynamic configuration and map data refactoring.
