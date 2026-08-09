# Phase 4 Research: Dynamic Room Integration (Refinement)

## Analysis of Room Icon Mapping
- **Current State**: `src/db/room.tsx` defines a `roomIcons` array mapping `internalName` to icons.
- **Consumption**: `InvoiceEditor.tsx` imports and searches this array for every room rendered in the selection modal.
- **Technical Debt**: 
  - The mapping is manual and doesn't scale as new rooms are added to the backend.
  - The lookup logic (`roomIcons.find(...)`) adds minor overhead.
  - Standardizing to a single icon (`GiHouse`) simplifies the architecture.

## Identified Improvements
1. **Source of Truth**: Remove `roomIcons` from `src/db/room.tsx` entirely.
2. **UI Simplification**: Update `InvoiceEditor.tsx` to use a single static icon for all rooms.
3. **Consistency**: Check if other components (Maps, Room Manager) are using `roomIcons` and standardize them.

## Code Exploration Results
- `src/db/room.tsx`: Contains the `roomIcons` array.
- `src/Components/InvoiceEditor.tsx`: Uses `roomIcons` in the `openRoomModal` selection list.
- `src/Components/RoomManager.tsx`: Does NOT use `roomIcons`, already uses custom badges.
- `src/Components/ReservationMap.tsx`: Does NOT use `roomIcons`, uses text-based labels.
- `src/Components/InvoiceMap.tsx`: Does NOT use `roomIcons`, uses `GiHouse` for all rooms.

## Conclusion
The room icon mapping is redundant and only serves `InvoiceEditor.tsx` currently. Removing it and standardizing on a single icon is safe and improves maintainability.
