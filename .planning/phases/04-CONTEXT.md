# Phase 4 Context: Dynamic Room Integration

## Decisions
- **Scope Definition:** Phase 4 is strictly focused on ensuring all room-related data in the UI is fetched dynamically from the backend APIs, removing any remaining hardcoded or static room lists.
- **Data Source:** Use `src/db/room.ts` (`listRoom`) as the primary source of truth for all room data.
- **Migration Target:** Specifically target `src/db/invoice.ts` (`getItemList`) and any consumer of static room identifiers (e.g., "R1", "R2").
- **Deferred Work:** Interactive map enhancements, advanced filtering, and UX optimizations are officially moved to **Phase 5**.

## Code Context
- **Primary API:** `listRoom(page, size)` in `src/db/room.ts`.
- **Primary Type:** `Room` from `src/db/room.ts`.
- **Identified Debt:** `getItemList()` in `src/db/invoice.ts` contains static room objects that must be replaced or supplemented by API data.
- **Interaction Pattern:** Continue using `useEffect` for fetching data on component mount or dependency change, consistent with `ReservationMap` and `InvoiceMap`.

## Gray Areas Resolved
- All UX-heavy features (modals, interactivity, advanced filters) are moved to Phase 5.
- Phase 4 success is measured by the total removal of static room arrays from the codebase.
