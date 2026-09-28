---
title: 2026-09-28-expense-group-by-date
type: plan
date: 2026-09-28
status: draft
project: pms-ts
scope: shared
author: Minh Trần
ticket: null
tags: [expenses, ui, dates]
related: []
---

# Expense List Grouped by Date Implementation Plan

## Overview

Split the expense list in `ExpenseManager` into sections, one per calendar day (Vietnam local time),
each with a header showing the day and that day's total amount. Also let staff choose the date of an
expense in the Add/Edit form instead of always recording "now". Front-end only: the expense API
(`src/db/expense.ts`) and the `Expense` payload shape stay exactly the same.

## Current State Analysis

- **Fetching** — `fetchExpenses` (`src/Components/ExpenseManager.tsx:126`) calls `listExpenseByDate`
  (managers, `expense:assign`) or `listExpenseByExpenserAndDate` with `byDate = today`, paginated with
  `DEFAULT_PAGE_SIZE`. The response is a Spring page (`content`, `number`, `size`, `totalElements`,
  `totalPages`) that covers **several days, newest first**. The page content is stored as-is in
  `expenses` (`:157-158`).
- **Rendering** — a flat `divide-y` list (`:564-613`). Each row shows `itemName`, then a small line
  with `<Moment format="DD.MM">{new Date(item.expenseDate)}</Moment>` (`:575-577`), quantity, amount,
  service and (for managers) the expenser id, plus delete/assign/edit icons.
- **Date storage format** — `expenseDate` is written by `formatISODateTime`
  (`src/Service/Utils.ts:72`), which is `toISOString().substring(0, 19)`: a **UTC** time **without
  `Z`**, e.g. 06:00 Vietnam time on 28.09 is stored as `2026-09-27T23:00:00`. The current display
  `new Date(item.expenseDate)` parses a string without `Z` as *local* time, so the shown `DD.MM` is
  wrong for expenses recorded between 00:00 and 07:00 local time.
- **Form** — the edit modal (`:713-898`) has no date field. `expenseDate` comes from:
  - `defaultEmptExpense.expenseDate` (`:55`), evaluated **once at module load**, so it goes stale if
    the tab stays open past midnight (the Add button passes `defaultEmptExpense` at `:688`);
  - `generateExpense` (`:397`), which always sets `expenseDate: formatISODateTime(new Date())`;
  - `processSaveExpense` (`:432`), which sends `editingExpense.origin.expenseDate` unchanged.
- **Existing patterns** — native date inputs through flowbite `TextInput type="date"`
  (`ImmigrationRegistrationManager.tsx:257`). `react-moment`/`moment` are already used for date labels.
- **Tests** — Jest is broken (see `2026-09-27-order-push-notifications.md`), so verification is
  `tsc`, ESLint and a `CI=true` build, plus manual checks.

## Desired End State

1. The expense list shows one header per local day, newest day first, e.g.
   `Mon 28.09 ········· 245.000 ₫`, followed by that day's expenses in the order the API returned them.
2. The header total is the sum of `amount` for that day's items **on the current page**. If a day
   continues on the next page, its header appears again there with the total for that page's items.
3. Rows no longer repeat the day. The old `DD.MM` slot shows the local time `HH:mm` instead.
4. The Add/Edit form has a **Date** field (default: today). Saving writes the chosen day into the
   existing `expenseDate` field (UTC, same format as today), keeping the time of day.
5. An expense created at 06:00 local time on 28.09 appears under **28.09**, not 27.09.

## What We're NOT Doing

- No change to `src/db/expense.ts`, request parameters or the backend.
- No change to pagination (no "load more" / infinite scroll). Grouping is per page.
- No day navigator or date filter above the list. `byDate` stays "today".
- No item-count or "Today/Yesterday" labels in the header (not requested).
- No change to how the backend interprets `byDate` (it is a UTC date. We leave that alone).

## Implementation Approach

Keep the logic in small pure helpers so the render stays simple:
`parseExpenseDate` (stored string → `Date`, read as UTC) → `localDayKey` (`Date` → local `YYYY-MM-DD`)
→ `groupExpensesByDay` (page content → ordered day groups with totals). The form writes dates back
with the existing `formatISODateTime`, so the stored format doesn't change.

---

## Phase 1: Date helpers and grouping function

### Changes Required

#### 1. `src/Service/Utils.ts`

Add two helpers next to `formatISODateTime`:

```ts
export const parseUTCDateTime = (value: string) => {
    // Stored expense/entity times are UTC without a zone suffix (see formatISODateTime).
    // Append 'Z' so the browser does not read them as local time; keep explicit zones as-is.
    return new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : value + 'Z')
}

export const formatLocalISODate = (date: Date) => {
    // Format: 2024-07-30 in the browser's time zone (unlike formatISODate, which uses UTC)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
```

#### 2. `src/Components/ExpenseManager.tsx`

Add an exported type and pure function near the `Expense` type:

```ts
export type ExpenseDayGroup = {
  day: string;        // local YYYY-MM-DD, used as React key
  date: Date;         // first item's parsed date, used for the header label
  total: number;
  items: Expense[];
};

export const groupExpensesByDay = (expenses: Expense[]): ExpenseDayGroup[] => {
  const groups = new Map<string, ExpenseDayGroup>();
  for (const exp of expenses) {
    const date = parseUTCDateTime(exp.expenseDate);
    const day = formatLocalISODate(date);
    const group = groups.get(day) ?? { day, date, total: 0, items: [] };
    group.items.push(exp);
    group.total += exp.amount;
    groups.set(day, group);
  }
  // Newest day first. Items keep the API order within a day.
  return Array.from(groups.values()).sort((a, b) => b.day.localeCompare(a.day));
};
```

### Success Criteria

#### Automated Verification
- [ ] Type check: `npx tsc --noEmit -p .`
- [ ] Lint, zero warnings: `npx eslint --no-eslintrc -c node_modules/eslint-config-react-app/index.js --max-warnings 0 src/Service/Utils.ts src/Components/ExpenseManager.tsx`

#### Manual Verification
- [ ] In the browser console, check that `parseUTCDateTime('2026-09-27T23:00:00')` gives 28.09 06:00 in
  Vietnam time and that a value that already ends in `Z` is unchanged.

---

## Phase 2: Render the grouped list

### Changes Required

#### 1. `src/Components/ExpenseManager.tsx` — list body (`:564-613`)

- Compute `const dayGroups = useMemo(() => groupExpensesByDay(expenses), [expenses]);`
  (add `useMemo` to the React import).
- Replace the flat `expenses?.map(...)` with a map over `dayGroups`. Each group renders:
  - a header: `sticky top-0 z-[5] flex justify-between bg-green-50 px-1 py-0.5 text-xs font-semibold text-green-900`
    with `<Moment format="ddd DD.MM">{group.date}</Moment>` on the left and `formatVND(group.total)`
    on the right. Use a z-index below the loading spinner's `z-10` so the spinner stays on top.
  - the existing row markup for each `group.items` item, unchanged except for the date label below.
- In the row, replace `<Moment format="DD.MM" className="w-10">{new Date(item.expenseDate)}</Moment>`
  with `<Moment format="HH:mm" className="w-10">{parseUTCDateTime(item.expenseDate)}</Moment>`.
- Keep the outer `transition-opacity` wrapper and `opacity-50` loading behaviour. Move `divide-y` onto
  each group's item container so the headers don't get divider lines.

### Success Criteria

#### Automated Verification
- [ ] Type check: `npx tsc --noEmit -p .`
- [ ] Lint (same command as Phase 1)
- [ ] CI build: `CI=true npm run build`

#### Manual Verification
- [ ] With expenses across at least two days, each day has one header, newest day first, and the
  header total matches the sum of that day's rows.
- [ ] An expense stored between 17:00 and 23:59 UTC appears under the next local day with the correct
  `HH:mm`.
- [ ] On page 2 of a day that spans two pages, the header appears again with the page-2 subtotal.
- [ ] Headers stay pinned while scrolling a long day, and the reload spinner still shows above them.
- [ ] Delete, assign (manager) and edit icons still work on grouped rows.
- [ ] Non-manager view (no `expense:assign`) still works and hides the expenser id.

---

## Phase 3: Date field in the Add/Edit form

### Changes Required

#### 1. `src/Components/ExpenseManager.tsx` — new-expense defaults

- Replace the Add button's `editExpense(defaultEmptExpense)` (`:688`) with
  `editExpense({ ...defaultEmptExpense, expenseDate: formatISODateTime(new Date()) })` so the default
  is "now" when the button is clicked, not when the module loaded.

#### 2. Date change handler

```ts
const changeExpenseDate = (e: ChangeEvent<HTMLInputElement>) => {
  const [y, m, d] = e.target.value.split("-").map(Number);
  if (!y || !m || !d) return;
  // Keep the expense's time of day; only move it to the chosen local day
  const current = parseUTCDateTime(editingExpense.origin.expenseDate);
  const next = new Date(y, m - 1, d, current.getHours(), current.getMinutes(), current.getSeconds());
  setEditingExpense({
    ...editingExpense,
    origin: { ...editingExpense.origin, expenseDate: formatISODateTime(next) },
  });
};
```

#### 3. Form field

Add a row after **Item Name**, using the same label layout as the other rows:

```tsx
<div className="flex w-full flex-row align-middle">
  <div className="flex w-2/5 items-center">
    <Label htmlFor="expenseDate" value="Date" />
  </div>
  <TextInput
    id="expenseDate"
    type="date"
    required
    max={formatLocalISODate(new Date())}
    value={formatLocalISODate(parseUTCDateTime(editingExpense.origin.expenseDate))}
    onChange={changeExpenseDate}
    className="w-full"
  />
</div>
```

`max` blocks future dates.

#### 4. Keep the chosen date across AI generation and "Save & Continue"

- `generatePopupExpense` (`:366`): after `generateExpense` returns, set
  `expenseDate: editingExpense.origin.expenseDate` on the result so the AI ("brain") button doesn't
  reset a date the user already picked.
- `handleSaveAndContinueExpense` (`:485`): reset to
  `{ ...defaultEditingExpense, origin: { ...defaultEmptExpense, expenseDate: editingExpense.origin.expenseDate } }`
  so several items can be entered for the same past day in a row.

### Success Criteria

#### Automated Verification
- [ ] Type check: `npx tsc --noEmit -p .`
- [ ] Lint (same command as Phase 1)
- [ ] CI build: `CI=true npm run build`

#### Manual Verification
- [ ] Add → the Date field shows today's date. Save → the item appears under today's header.
- [ ] Add, choose yesterday, save → the item appears under yesterday's header. The saved
  `expenseDate` (network tab) is UTC with no `Z`, in the same format as before.
- [ ] Edit an existing expense → the Date field shows its local day. Change it → the item moves to
  the new day's group, and the time of day is unchanged.
- [ ] Choose a past date, then use the AI button → the date is kept.
- [ ] Save & Continue after choosing a past date → the next blank form keeps that date.
- [ ] Future dates can't be selected.
- [ ] Leave the tab open past midnight → Add defaults to the new day.

---

## Testing Strategy

Jest is currently broken in this repo, so there are no new unit tests. `groupExpensesByDay`,
`parseUTCDateTime` and `formatLocalISODate` are pure and exported, so they can be tested once Jest is fixed:
- grouping keeps API order within a day and sorts days newest first;
- the day boundary at `…T16:59:59` vs `…T17:00:00` UTC (UTC+7);
- totals add up correctly.

## Performance Considerations

Grouping one page (`DEFAULT_PAGE_SIZE` items) is O(n) with memoization. No new network calls.

## Risks / Notes

- The backend's `byDate` works on UTC dates, while groups use local dates. The API response is the
  same, so this only affects which items land on which page, not correctness.
- Fixing the parse (`+ 'Z'`) changes the day shown for expenses recorded between 00:00 and 07:00 local
  time. The new day is the correct one; the old display was wrong.

## References

- Component: `src/Components/ExpenseManager.tsx`
- API wrapper (unchanged): `src/db/expense.ts`
- Date utils: `src/Service/Utils.ts:64-78`
- Date input pattern: `src/Components/ImmigrationRegistrationManager.tsx:257`
