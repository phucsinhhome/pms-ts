# Phase 4 Plan: Dynamic Room Integration (Refined)

This phase focuses on removing all static room data, standardizing room-related UI components, and ensuring all data is fetched dynamically.

## Tasks

### 1. Remove Room Icon Mapping (Technical Debt)
- [ ] Delete `roomIcons` array from `src/db/room.tsx`.
- [ ] Clean up imports of `roomIcons` in any consumer components.

### 2. Standardize Room Selection UI in InvoiceEditor
- [ ] Update `openRoomModal` list in `InvoiceEditor.tsx` to use a single standard icon (`GiHouse`) for all rooms.
- [ ] Remove lookup logic (`roomIcons.find(...)`) from the room rendering loop.

### 3. Finalize Static Data Elimination
- [ ] (Completed) Deprecate `getItemList` in `src/db/invoice.ts`.
- [ ] (Completed) Remove static room arrays from `src/db/staticdata.ts`.

### 4. Verification and Cleanup
- [ ] Run `tsc --noEmit` to ensure no broken references remain.
- [ ] Verify `InvoiceEditor` still displays rooms correctly with the unified icon.

## Verification
- [ ] **Modal Verification**: Open Room Selection in Invoice Editor and confirm all rooms have the same icon.
- [ ] **Build Stability**: No compilation errors after removing the mapping.
