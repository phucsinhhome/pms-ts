# Research: Phase 2 — Configuration Caching & Resilience

## Standard Stack
- **LocalStorage API**: Used for persistent client-side storage of the `app.json` configuration.
- **JSON Serialization**: `JSON.stringify` and `JSON.parse` for storing complex objects in `localStorage`.
- **Async/Await & Promises**: Core mechanism for handling network requests and retries.
- **Window Location**: `window.location.reload()` is the standard way to apply a background-refreshed configuration, though this phase prioritizes "deferred update" (apply on next manual reload).

## Architecture Patterns

### 1. Cache-First with Background Refresh
- **Goal**: Immediate app interactivity.
- **Pattern**: 
    1. Check `localStorage` for `pms_app_config`.
    2. If found: Return cached data immediately to the caller (`App.tsx`) to allow rendering.
    3. Side-effect: Trigger a non-blocking background fetch to refresh the `localStorage` data for future sessions.
    4. If NOT found: Proceed to the "Retry Mechanism".

### 2. Idempotent Background Refresh
- **Goal**: Update cache without disrupting the current user session.
- **Pattern**: The background fetch updates `localStorage` but does **not** update the React state (`configs`) in the current component tree. This ensures the UI remains consistent during the session, avoiding unexpected layout shifts or logic changes.

### 3. Asynchronous Retry Mechanism
- **Goal**: Resilience against transient network failures when no cache is available.
- **Pattern**: 
    - Attempt fetch up to 3 times.
    - Use a small delay (e.g., 1s, 2s, 4s) between retries (exponential backoff or simple fixed interval).
    - Only trigger this if `localStorage` is empty. If cache exists, a single background attempt is sufficient.

## Don't Hand-Roll
- **Retry Libraries**: For a simple 3-retry requirement, avoid importing heavy libraries like `axios-retry` or `react-query` if they aren't already in the stack. A clean `for` loop with `await new Promise(r => setTimeout(r, delay))` is more maintainable and transparent for this specific use case.
- **Complex Cache Invalidation**: Avoid complex TTL (Time To Live) logic for now. A simple "refresh every time, but apply next time" strategy is robust and easy to reason about.

## Common Pitfalls
- **Invalid JSON in LocalStorage**: Always wrap `JSON.parse` in a `try-catch` block to handle corrupted cache data.
- **Storage Limits**: `localStorage` has a limit (typically 5MB). `app.json` is small (~KB), so this is unlikely to be an issue, but good to keep in mind.
- **Race Conditions**: Ensure the background refresh doesn't accidentally trigger a state update if the user has navigated away or if the app logic assumes `configs` is immutable after first load.
- **Environment Variables**: Ensure `REACT_APP_CONFIG_ENDPOINT` or the GitHub URL is consistently used and fallback-aware.

## Code Examples

### Simple Retry Wrapper
```typescript
const fetchWithRetry = async (url: string, retries: number, delay: number): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
};
```

### Integrated `appConfigs` logic
```typescript
export const appConfigs = async (): Promise<AppConfig> => {
    const CACHE_KEY = 'pms_app_config';
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            // Background refresh (non-blocking)
            fetchWithRetry(CONFIG_URL, 1, 0)
                .then(fresh => localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)))
                .catch(err => console.warn("Background refresh failed", err));
            return parsed;
        } catch (e) {
            console.warn("Cache corrupted, fetching fresh...");
        }
    }

    // No cache: Fetch with 3 retries
    const fresh = await fetchWithRetry(CONFIG_URL, 3, 1000);
    localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
    return fresh;
};
```
