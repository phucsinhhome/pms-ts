# Project Improvement Plan - PMS

## Status Summary
The project has recently gained robust Room and Rate Plan management features. Reservation and Order management are functional but have some critical gaps and technical debt.

## Planned Tasks

### 1. Bug Fixes
- [x] **Order Management**: Implement backend persistence for linking invoices to orders in `OrderEditor.tsx`. Currently, it only updates local state.

### 2. Feature Completion
- [x] **Tour Management**: Implement the `handleSave` function in `TourEditor.tsx` to persist changes to the backend.

### 3. Refactoring & Technical Debt
- [x] **Reservation Map**: Dynamically fetch room names from the database in `ReservationMap.tsx` instead of using the hardcoded `["R1", "R2", "R3", "R4", "R5", "R6"]`.
- [x] **Invoice Map**: Dynamically build the room map in `InvoiceMap.tsx` based on actual room data from the database.

## Priority
1. Order Management Bug Fix (Critical) - **DONE**
2. Tour Management Save Feature (High) - **DONE**
3. Reservation/Invoice Map Refactoring (Medium) - **DONE**
