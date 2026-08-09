# Task: Fix Room Pre-selection in InvoiceEditor

## Problem
In `InvoiceEditor.tsx`, the `chooseRoom` function incorrectly attempts to find room objects by matching `invoice.rooms` values against `room.name` instead of `room.internalName`. Since `invoice.rooms` stores internal names, the lookup fails and no rooms are pre-selected in the modal.

## Plan
1.  **Fix Lookup**: Update `chooseRoom` in `src/Components/InvoiceEditor.tsx` to use `r.internalName` for the find operation.
2.  **Verify**: Run `tsc --noEmit` to ensure no regressions.

## Execution
- File: `src/Components/InvoiceEditor.tsx`
- Replace: `rooms.find((r) => rN === r.name)` with `rooms.find((r) => rN === r.internalName)`
