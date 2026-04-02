# Project State: PMS (pms-ts)

**Project Name:** PMS (pms-ts)
**Current Phase:** Phase 1: Foundation & Refactoring (IN PROGRESS)
**Objective:** Replace hardcoded room names in maps with dynamic data and refactor shared services.
**Current Focus:** Ensuring `ReservationMap` and `InvoiceMap` are fully database-driven.

## Recent Updates
- **Initial Setup Completed**:
    - Created `.planning` directory and documentation files (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`).
    - Mapped the codebase and identified key components (`InvoiceManager`, `ReservationManager`, `OrderEditor`, etc.).
    - Verified `PLAN.md` tasks: Order-Invoice bug fix (done), Tour Management save (done), and Map refactoring (done - need verification).

## Known Issues & Debt
- **Map Refactoring Needs Verification**: Confirm if `ReservationMap.tsx` and `InvoiceMap.tsx` are correctly fetching data.
- **Microservices Complexity**: Managing multiple Axios instances for different domains can lead to redundancy in API logic.
- **Inconsistent Error Handling**: Ensure all user-facing actions have unified error reporting and feedback.

## Next Steps
- Verify the dynamic data fetching in `ReservationMap.tsx`.
- Review `InvoiceMap.tsx` for database-driven room mapping.
- Refactor `src/db/apis.ts` to reduce potential redundancy in Axios instance creation.
- Implement more robust error handling in the `handleSave` functions of editors.
