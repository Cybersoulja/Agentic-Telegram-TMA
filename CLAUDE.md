# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Telegram Mini App (TMA) prototype — a multi-tab "control hub" launched from a Telegram bot's web_app button:
- **Backend** (`packages/bot/`): a single Cloudflare Worker (TypeScript) that handles the Telegram webhook, validates `initData` via HMAC-SHA256, and persists user profiles/activity to D1 (with a KV read-through cache).
- **Frontend** (`apps/frontend/`): a Vite + React 19 + TypeScript SPA styled entirely with Telegram's native theme CSS variables, using the Telegram WebApp SDK (`telegram-web-app.js`) for haptics, the Main Button, CloudStorage, and BiometricManager.
- **Package manager**: npm workspaces (`packages/*`, `apps/*`).

## Commands

Run from the repo root unless noted.

```bash
npm install                    # install all workspace deps

npm run dev:bot                # wrangler dev, backend Worker on :8787
npm run dev:frontend           # vite dev, frontend on :5173

npm run check-types            # type-checks both workspaces (tsc -b / tsc --noEmit)
npm run build:frontend         # tsc -b && vite build (apps/frontend)
npm run deploy:bot             # wrangler deploy (packages/bot)
```

Per-workspace only:
```bash
npm run lint --workspace=apps/frontend     # oxlint
npm run check-types --workspace=packages/bot   # tsc --noEmit
npm run check-types --workspace=apps/frontend  # tsc -b
```

There is no test suite in this repo currently.

## Git workflow

Documentation-only changes (`CLAUDE.md`, `AGENTS.md`, `README.md`, code comments) should be committed and pushed directly to `main` — do not open a pull request for these. Open a pull request for source code changes, or when wrapping up an end-of-day batch of work.

### Local environment setup
Create `packages/bot/.dev.vars` (gitignored) from `packages/bot/.dev.vars.example`:
```ini
TELEGRAM_BOT_TOKEN="your_bot_token"
MINI_APP_URL="http://localhost:5173"
```
The frontend reads its backend URL from `VITE_API_URL` (default `http://localhost:8787`), and it can also be changed at runtime from the Settings tab (see `SettingsTab.tsx` / `App.tsx`'s `backendUrl` state).

The integrations hub (see below) also reads `N8N_URL`, `QWEN_TTS_URL`, and `NOVELAI_AGENT_PATH` — these default to generic local placeholders in `wrangler.jsonc`/`integrations.ts` and can be overridden per-developer via `.dev.vars`.

## Architecture

### Backend (`packages/bot/src/`)
Everything is a single Worker `fetch` handler in `index.ts` that manually dispatches on `url.pathname` + `request.method` (no router library). Key routes:
- `GET /` — health/info listing all endpoints
- `GET /setup-webhook` — registers the Worker's `/webhook` URL with Telegram via `setWebhook`
- `POST /webhook` — receives Telegram updates; `handleTelegramUpdate` replies to `/start` with an inline keyboard `web_app` button that opens `MINI_APP_URL`
- `POST /api/validate` — verifies `initData` HMAC and logs an `app_launch` activity row
- `GET /api/db/init` — creates the `users` and `activity_logs` D1 tables (idempotent, `CREATE TABLE IF NOT EXISTS`)
- `GET/POST /api/profile` — read/write a user profile, backed by D1 with a KV cache
- `/api/integrations/*` — delegated to `handleIntegrationsRoute` in `integrations.ts`

Env bindings (`Env` interface in `index.ts`, extends `IntegrationsEnv`): `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL`, `TMA_KV` (KVNamespace), `TMA_DB` (D1Database). Configured in `wrangler.jsonc`.

**initData verification** (`verifyTelegramInitData` in `index.ts`): reimplements Telegram's documented HMAC-SHA256 check using only the runtime Web Crypto API (`crypto.subtle`) — no external crypto dependency. Also rejects data older than `maxAgeSeconds` (default 24h). Do not replace this with a third-party library.

**Storage layer** (`db.ts`): D1 is the source of truth; KV is a 3600s read-through/write-through cache keyed `user:{userId}`. `getUserProfile` checks KV first, falls back to D1, and repopulates KV on a D1 hit — that repopulation is registered with the route handler's `ctx.waitUntil()` (an optional `ctx` param) so the Worker runtime doesn't terminate it after the response is returned. All D1/KV errors are caught and logged, never thrown, so profile/activity failures degrade gracefully instead of breaking a request.

**Integrations hub** (`integrations.ts`): proxies/mocks three external local services — n8n workflow hub, a Qwen3-TTS voice studio, and a "NovelAI Lorebook Agent" sandbox. `GET .../status` health-checks n8n and Qwen over HTTP with a 2s timeout; `POST .../trigger` dispatches to one of `novelai` (mocked response), `n8n` (proxies to `${N8N_URL}/webhook/{action}`), or `qwen_tts` (mocked). `NOVELAI_AGENT_PATH` is a purely informational path echoed in the status response — its default is a generic placeholder, not a real filesystem path, so set it via `.dev.vars` if you want a meaningful value locally. These are local/dev-only integrations, not production services — treat their responses as illustrative stubs when extending.

### Frontend (`apps/frontend/src/`)
`App.tsx` is the shell: it initializes the Telegram WebApp SDK on mount (`ready()`, `expand()`, Main Button wired to `close()`), resolves the current user from `webApp.initDataUnsafe.user` (falling back to a hardcoded mock user when not running inside Telegram, e.g. in a browser), and fetches/merges the D1 profile via `GET /api/profile`. It then renders one of four tabs selected via `TabBar` (`TabId = "dashboard" | "storage" | "integrations" | "settings"`), each a standalone component in `src/components/`:
- `DashboardTab` — triggers `/api/validate` to prove the HMAC handshake works, haptics demo
- `StorageBiometricsTab` — exercises `webApp.CloudStorage` (get/set/list keys) and `webApp.BiometricManager` (init/request access/authenticate)
- `IntegrationsTab` — calls the backend's `/api/integrations/*` routes
- `SettingsTab` — lets the user change `backendUrl` at runtime and refresh their profile

`telegram.d.ts` hand-declares the Telegram WebApp SDK types (`window.Telegram.WebApp`) since there's no official `@types` package in use — extend this file when using additional SDK surface.

**Styling convention**: all colors must come from Telegram theme CSS variables (`var(--tg-theme-bg-color)`, `--tg-theme-text-color`, `--tg-theme-button-color`, etc., set in `App.css`/`index.css`) so the UI matches the user's Telegram light/dark theme automatically. Do not hardcode a light/dark palette.

### TypeScript configuration
The bot and frontend are independently type-checked and use different configs/module resolution — `packages/bot` targets the Workers runtime (`tsc --noEmit`, `@cloudflare/workers-types`), `apps/frontend` uses project references (`tsconfig.app.json` for app code, `tsconfig.node.json` for `vite.config.ts`) and bundler module resolution (`tsc -b`). Always run `npm run check-types` from the root to check both rather than assuming one config covers the other.
