# Research: Room and Invoice Map Optimization

## Current State Analysis
- **RoomManager**: Uses `internalRoomName` for mapping. This is fragile if the backend or user updates names without updating reservations.
- **InvoiceMap**: Uses a 2-column grid that might hide rooms if the data matching fails.
- **Data Inconsistency**: Reservations use `ResRoom` which has `internalRoomName`, while `Invoice` has a simple `rooms: string[]` (likely IDs or names).

## Proposed Improvements
- **ID-Based Mapping**: Use `id` as the primary key for all room-related associations.
- **Static Grid with Dynamic Content**: Render the room list first, then overlay the guest/reservation data. This prevents "missing room" bugs.
- **Unified Types**: Ensure `Room` type is consistent across all components.

## Technical Notes
- Room ID is the only immutable field for a room.
- `Invoice` `rooms` field needs to be verified: is it `string[]` of IDs or names? (Research needed during implementation).
