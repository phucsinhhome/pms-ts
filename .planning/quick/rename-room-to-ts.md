# Task: Rename room.tsx to room.ts

## Problem
`src/db/room.tsx` no longer contains any JSX code. It is now a pure TypeScript file. Renaming it to `.ts` is more accurate and follows TypeScript conventions.

## Plan
1.  **Rename File**: Rename `src/db/room.tsx` to `src/db/room.ts` using `git mv`.
2.  **Verify**: Run `tsc --noEmit` to ensure no broken imports or type issues.

## Execution
- File: `src/db/room.tsx` -> `src/db/room.ts`
