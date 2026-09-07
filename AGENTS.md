# AGENTS.md

This file provides context, rules, and guidelines for AI agents working within this Telegram Mini App monorepo workspace.

---

## Project Overview

This is a full-stack Telegram Mini App prototype using:
- **Backend**: Cloudflare Workers (TypeScript) handling Telegram updates and HMAC-SHA256 data validations.
- **Frontend**: Vite + React + TypeScript optimized for Telegram clients (using native theme variables, haptics, and the Main Button).
- **Package Manager**: npm workspaces (`packages/*`, `apps/*`).

---

## Workspace Directory Structure

*   `packages/bot/`: Cloudflare Worker bot codebase.
    *   `src/index.ts`: Main request handler (Bot webhook handler, CORS headers, signature validation).
    *   `wrangler.jsonc`: Wrangler Worker config.
    *   `.dev.vars.example`: Local environment secrets template.
*   `apps/frontend/`: React Vite client codebase.
    *   `src/App.tsx`: Main user interface dashboard.
    *   `src/App.css`: Visual styling responsive to Telegram client theme variables.
    *   `src/telegram.d.ts`: TypeScript type definitions for the Telegram WebApp SDK.
    *   `index.html`: Entry page loading `telegram-web-app.js`.

---

## Developer Setup Instructions

1.  **Install dependencies**:
    From the root directory, run:
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    Create `packages/bot/.dev.vars` matching the variables in `.dev.vars.example`:
    ```ini
    TELEGRAM_BOT_TOKEN="your_bot_token"
    MINI_APP_URL="http://localhost:5173"
    ```
3.  **Local Dev Servers**:
    Start the backend worker and frontend React app concurrently:
    - Terminal 1: `npm run dev:bot` (runs Wrangler on port 8787)
    - Terminal 2: `npm run dev:frontend` (runs Vite on port 5173)

---

## CLI Command Reference

| Action | Command | Scope |
| :--- | :--- | :--- |
| **Install** | `npm install` | Root workspace |
| **Bot Local Dev** | `npm run dev:bot` | Backend Worker |
| **Frontend Local Dev**| `npm run dev:frontend` | React Client |
| **Type Check** | `npm run check-types` | Entire Workspace |
| **Build Frontend** | `npm run build:frontend` | React Client |
| **Deploy Bot** | `npm run deploy:bot` | Cloudflare Worker |

---

## Git Workflow

Documentation-only changes (`CLAUDE.md`, `AGENTS.md`, `README.md`, code comments) should be committed and pushed directly to `main` — do not open a pull request for these. Open a pull request for source code changes, or when wrapping up an end-of-day batch of work.

---

## Development Guidelines for Agents

### 1. Telegram Client Theme Syncing
- Ensure all styles in the frontend rely on Telegram's CSS variables (e.g., `var(--tg-theme-bg-color)`, `var(--tg-theme-text-color)`) so the app matches the user's Telegram theme (dark or light mode) automatically.
- Do not import large or hardcoded dark/light color themes unless requested.

### 2. Secure Web Crypto Checks
- When verifying Telegram's `initData` launch parameters, do not pull in heavy external cryptography packages.
- Always use the native runtime Web Crypto API (`crypto.subtle`) as implemented in `packages/bot/src/index.ts`.

### 3. Isolated Typescript Verification
- The bot and frontend use separate TS configurations. Ensure that changes in the frontend (`apps/frontend/`) are type-checked with `tsc -b` and changes in the worker (`packages/bot/`) are type-checked with `tsc --noEmit`.
- Run `npm run check-types` at the root to check both at once.

### 4. Cloudflare Workers Builds (production deploy)
- The production Worker (script name `trillastrob`) auto-deploys via Cloudflare's git integration on every push — this is separate from `npm run deploy:bot` and isn't visible in this repo's own CI.
- The Cloudflare project's Root directory is `packages/bot`, so its build/deploy commands run scoped to that workspace, not the monorepo root. Both the root `package.json` and `packages/bot/package.json` need a `build` script (currently no-ops — `wrangler deploy`/`versions upload` does the actual bundling) or the Workers Builds pipeline fails with `Missing script: "build"`.
- `packages/bot/wrangler.jsonc`'s `kv_namespaces[].id` and `d1_databases[].database_id` must be real Cloudflare resource IDs, never local-dev placeholders — an invalid ID fails the deploy step, visible only in the Cloudflare dashboard's build log.
- The dashboard's Deploy/Version commands should never hardcode an entry-point path argument (e.g. `wrangler versions upload src/index.js`) — let `wrangler.jsonc`'s `main` field govern it, or the path can silently drift out of sync with the repo. That setting lives only in the Cloudflare dashboard, not this repo.
