## Phase 6: Room Manager and Invoice Map Optimization

### Task 1: Refactor RoomManager Data Mapping
- Update `src/Components/RoomManager.tsx` to use room IDs for reservation mapping.
- Ensure the `reservationMap` is initialized correctly with all room IDs.
- Fix row keys and data matching logic to handle inconsistent room names/IDs.

### Task 2: Optimize RoomManager Component Lifecycle
- Separate room fetching and reservation fetching into distinct `useEffect` hooks.
- Implement a more efficient way to handle date range changes without redundant API calls.

### Task 3: Improve InvoiceMap Room-Centric View
- Refactor `src/Components/InvoiceMap.tsx` to ensure every room is visible, even if empty.
- Fix the matching logic between invoices and rooms to use IDs/Internal names consistently.
- Add "Empty Room" placeholders to the grid to clearly distinguish from "Loading" or "Missing" states.

### Task 4: UI/UX Synchronization
- Ensure both `RoomManager` and `InvoiceMap` use the same underlying room data structures.
- Add navigation links from the maps to the corresponding invoice/reservation editors.

### Verification
- **Test 1: Room Persistence**: Verify all rooms from the database are rendered in both views.
- **Test 2: Accurate Mapping**: Check that guests are mapped to the correct rooms in both the timeline and grid views.
- **Test 3: Date Navigation**: Ensure date switching correctly updates both views without data leakage.
