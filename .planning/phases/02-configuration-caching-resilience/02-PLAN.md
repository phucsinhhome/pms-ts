## Phase 2: Configuration Caching & Resilience

### Task 1: Refactor appConfigs with Cache-First Strategy
- Update `src/db/configs.ts` to implement a cache-first approach for `appConfigs()`.
- Implement `localStorage` check using the key `pms_app_config`.
- If cached data exists:
    - Parse with `JSON.parse` inside a `try-catch` block to handle potential corruption.
    - Return the cached `AppConfig` immediately to ensure instant app initialization.
    - Trigger a **non-blocking** background fetch to update the `localStorage` cache for the next session.
- If no cache exists or it is invalid:
    - Proceed to the fetch logic (with retries).

### Task 2: Implement Async Retry Mechanism
- Add a helper function `fetchWithRetry` (or integrate the logic directly into `appConfigs`) in `src/db/configs.ts`.
- Requirements for the "No Cache" scenario:
    - Attempt to fetch the configuration up to **3 times**.
    - Implement a **1000ms delay** between attempts.
- If the fetch succeeds:
    - Store the fresh config in `localStorage`.
    - Return the config to the caller.
- If all 3 attempts fail:
    - Throw a clear error (e.g., `Error("Failed to load configuration after 3 retries")`).

### Task 3: Update App.tsx Loading & Error States
- Refine `fetchConfig` and the initialization flow in `App.tsx`.
- Introduce an `error` state in `App` component to track configuration or profile fetch failures.
- Update `fetchConfig` to:
    - Catch errors from `appConfigs()`.
    - If an error occurs and no configuration is available, set the error state.
- Ensure the `loading` state persists if no cache is found and a fetch is in progress.
- Implement an **"Offline/Update Failed"** error view in the `render` logic:
    - Displayed if `loading` is false but `configs` is missing (after failed retries).
    - Provide a "Retry" button that re-triggers `fetchConfig`.

### Task 4: UI/UX Refinement
- **Session Consistency**: Ensure that the background refresh triggered by Task 1 *does not* update the React state (`configs`) of the current session. This prevents unexpected UI changes while the user is active.
- **Initial Fetch UX**: Verify that the `lotus.png` loading spinner/splash screen is displayed correctly during the initial fetch when no cache is available.

### Verification
- **Test 1: Instant Load (Cache Hit)**:
    - Populate `localStorage` with a valid `pms_app_config`.
    - Reload the app.
    - Result: The app should bypass the "Loading" state (or show it only briefly) and render the dashboard immediately.
- **Test 2: Background Update**:
    - Modify the remote `app.json` (or simulate it).
    - Load the app from cache.
    - Result: `localStorage` should be updated with the new remote values, but the current session should still use the old cached values.
- **Test 3: Retry Logic (No Cache + Offline)**:
    - Clear `localStorage`.
    - Disable network or block the config URL.
    - Result: Observe 3 failed requests in the Network tab with ~1s intervals.
- **Test 4: Error Screen**:
    - After 3 failed retries (No Cache), the app should display an error message with a "Retry" option instead of an empty screen or infinite loader.
- **Test 5: Corruption Recovery**:
    - Set `pms_app_config` to an invalid string (e.g., `"invalid-json"`).
    - Reload the app.
    - Result: The app should catch the `JSON.parse` error and proceed to a fresh fetch.
