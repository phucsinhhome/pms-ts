# Quick Task: Fix Menu Path Error in App.tsx

## Problem
The app fails to start with `Uncaught TypeError: Cannot read properties of undefined (reading 'path')` at `App.tsx:325`.
This is caused by `filteredMenus` containing `undefined` values when `menuOrder` contains keys that do not exist in the `menus` object.

## Root Cause
- `menuOrder` contains `'rate-plan'`.
- `menus` contains the key `ratePlan`.
- When filtering and mapping, `menus['rate-plan']` returns `undefined`.

## Plan
1. Update `menuOrder` in `src/App.tsx` to use `ratePlan` instead of `rate-plan`.
2. Add a safety filter to `filterMenus` in `src/App.tsx` to ensure no `undefined` values are added to `filteredMenus`.
3. Verify the fix by ensuring the app starts without error (or at least that part of the code is safe).

## Execution
- [x] Update `menuOrder` in `src/App.tsx`.
- [x] Update `filterMenus` in `src/App.tsx`.
- [x] Update `STATE.md`.
