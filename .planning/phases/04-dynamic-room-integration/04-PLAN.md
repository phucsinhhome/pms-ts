# Phase 4 Plan: Dynamic Room Integration

This phase focuses on removing all static room data and ensuring the UI reflects dynamic data from the backend.

## Tasks

### 1. Centralize Room Icons and Types
- [ ] Add `roomIcons` mapping to `src/db/room.ts` or a shared component location.
- [ ] Ensure all components use the centralized `Room` type.

### 2. Refactor InvoiceEditor Room Selection
- [ ] Update `openRoomModal` to use a vertical list layout (e.g., using `Table` or a stacked list).
- [ ] Improve room selection visual feedback (using checkboxes or highlighted list items).
- [ ] Fix the `roomIcons` reference error.

### 3. Eliminate Static Data in DB Layer
- [ ] Deprecate `getItemList` in `src/db/invoice.ts`.
- [ ] Remove static room arrays from `src/db/staticdata.ts` (if they exist).

### 4. Update Initialization Logic
- [ ] Refactor `confirmNoRes` in `InvoiceEditor.tsx` to use the first room from the dynamic `rooms` state.
- [ ] Ensure `useEffect` handles room fetching before any default initialization that depends on room data.

## Verification
- [ ] **Modal Check**: Verify the Room selection modal in `InvoiceEditor` is vertical and functional.
- [ ] **No Book Check**: Verify creating a "No Book" invoice correctly uses a real room from the database.
- [ ] **API Sync**: Verify room names in Maps and Editors are perfectly in sync with the database.
