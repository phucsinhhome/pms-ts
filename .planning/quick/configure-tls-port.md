# Task: Configure app for TLS and Port 3001

## Problem
The app needs to run on port 3001 with HTTPS enabled for local development. Currently, `.env.development` has `PORT=3001` but is missing `HTTPS=true`.

## Plan
1.  **Update Environment Config**: Add `HTTPS=true` to `.env.development`.
2.  **Verify**: Ensure `PORT=3001` is correctly set in the same file.

## Execution
- File: `.env.development`
- Add: `HTTPS=true`
