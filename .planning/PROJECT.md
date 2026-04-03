# Project: PMS (pms-ts)

## Context
**Goal:** Improve and complete the Property Management System (PMS) frontend for homestays/resorts.
**Vision:** A robust, modular, and modern PMS that manages invoices, reservations, inventory, and profit reporting efficiently.
**Technology Stack:** React 18, TypeScript, Tailwind CSS, Flowbite, Axios.
**UI Aesthetic:** Professional, responsive, and functional with a focus on data density and clarity.

## Target Audience
- Homestay/Resort operators and administrators managing daily operations.

## Constraints
- Must integrate with existing microservice-oriented backend APIs (Expense, Invoice, Profit, Reservation, etc.).
- Leverage existing React components (e.g., InvoiceManager, ReservationManager).
- Maintain consistent styling using Tailwind CSS.
- High data density requirements for managing large numbers of reservations and invoices.

## History & Lessons
- Current state includes functional but incomplete modules for Invoices, Reservations, and Orders.
- Recently implemented robust Room and Rate Plan management.
- Identified needs: Better integration between orders and invoices, dynamic data fetching for maps, and improved error handling.
- Transitioning from hardcoded values to dynamic database-driven data (e.g., room names in maps).
