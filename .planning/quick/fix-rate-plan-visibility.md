# Quick Task: Fix Rate Plan Menu Visibility

## Problem
The user is authorized with `'rate-plan'`, but the Rate Plan menu does not show up.
This is because `menuOrder` contains `'ratePlan'`, and the matching logic `role.toLowerCase() === menuKey.toLowerCase()` fails for `'rate-plan'` vs `'rateplan'`.

## Root Cause
- `menuOrder` uses `'ratePlan'` (camelCase) to match the key in `menus`.
- The authority from the backend is `'rate-plan'` (kebab-case).
- The case-insensitive comparison `role.toLowerCase() === menuKey.toLowerCase()` removes the hyphen, resulting in a mismatch.

## Plan
1. Update `menus` object in `src/App.tsx` to use `'rate-plan'` as the key (with quotes) instead of `ratePlan`.
2. Update `menuOrder` in `src/App.tsx` to use `'rate-plan'`.
3. Update all references to `menus.ratePlan` to `menus['rate-plan']` in `src/App.tsx`.
4. Update `STATE.md`.

## Execution
- [x] Update `menus` and `menuOrder` in `src/App.tsx`.
- [x] Update `menus.ratePlan` references in `src/App.tsx`.
- [x] Update `STATE.md`.
