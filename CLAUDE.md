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

## Cloudflare Workers Builds (CI deploy)

There are two `wrangler.jsonc` files: `packages/bot/wrangler.jsonc` is canonical and used by `npm run dev:bot` / `npm run deploy:bot` (npm sets cwd to `packages/bot`). The root-level `wrangler.jsonc` exists only because Cloudflare Workers Builds (the git-connected CI that runs `npm run build` then `npx wrangler versions upload`) executes from the repo root with no `--config` flag, so it needs its own entry-point (`main: "packages/bot/src/index.ts"`) and a copy of the same `vars`/`kv_namespaces`/`d1_databases`. Keep the two files in sync when bindings change. The root `build` npm script is a no-op (`wrangler deploy`/`versions upload` bundles the Worker itself).

## Git workflow

Documentation-only changes (`CLAUDE.md`, `AGENTS.md`, `README.md`, code comments) should be committed and pushed directly to `main` — do not open a pull request for these. Open a pull request for source code changes, or when wrapping up an end-of-day batch of work.

### Local environment setup
Create `packages/bot/.dev.vars` (gitignored) from `packages/bot/.dev.vars.example`:
```ini
TELEGRAM_BOT_TOKEN="your_bot_token"
MINI_APP_URL="http://localhost:5173"
```
The frontend reads its backend URL from `VITE_API_URL` (default `http://localhost:8787`), and it can also be changed at runtime from the Settings tab (see `SettingsTab.tsx` / `App.tsx`'s `backendUrl` state).

The integrations hub (see below) also reads `N8N_URL`, `QWEN_TTS_URL`, `NOVELAI_AGENT_PATH`, `MIRROR_LEECH_URL`, `BLUESKY_PDS_URL`, and `CRAFT_API_URL` — these default to generic local placeholders in `wrangler.jsonc`/`integrations.ts` and can be overridden per-developer via `.dev.vars`. `CRAFT_API_URL` is a bearer credential (the Craft Connect link itself is the auth token) — never commit a real value; set it locally via `.dev.vars` and in production via `wrangler secret put CRAFT_API_URL`.

## Architecture

### Backend (`packages/bot/src/`)
Everything is a single Worker `fetch` handler in `index.ts` that manually dispatches on `url.pathname` + `request.method` (no router library). Key routes:
- `GET /` — health/info listing all endpoints
- `GET /setup-webhook` — registers the Worker's `/webhook` URL with Telegram via `setWebhook`
- `POST /webhook` — receives Telegram updates; `handleTelegramUpdate` replies to `/start` with an inline keyboard `web_app` button that opens `MINI_APP_URL`, and (if `GEMINI_API_KEY` is configured) runs the Trill Astro Buzz agent chain from `agent.ts` on any other text message
- `POST /api/validate` — verifies `initData` HMAC and logs an `app_launch` activity row
- `GET /api/db/init` — creates the `users` and `activity_logs` D1 tables (idempotent, `CREATE TABLE IF NOT EXISTS`)
- `GET/POST /api/profile` — read/write a user profile, backed by D1 with a KV cache
- `POST /api/mission-log` — chains three integrations together: reads the latest Tier 5 Oracle narrative from `activity_logs`, mocks a Qwen3-TTS `audio_url` and a Bluesky post `uri` for it, and persists the result to the `mission_logs` table
- `/api/integrations/*` — delegated to `handleIntegrationsRoute` in `integrations.ts`
- `/api/rpg/*` — delegated to `handleRpgRoute` in `rpg.ts`; the Aethermoor Chronicles RPG's backend (see below)

Env bindings (`Env` interface in `index.ts`, extends `IntegrationsEnv` and `AgentEnv`): `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL`, `TMA_KV` (KVNamespace), `TMA_DB` (D1Database). Configured in `wrangler.jsonc` — `kv_namespaces[].id` and `d1_databases[].database_id` point at real Cloudflare resources (not placeholders), so keep them in sync with the account's actual KV namespace/D1 database IDs. After first deploy (or if the D1 database is ever recreated), hit `GET /api/db/init` once to create the `users`/`activity_logs` tables.

**Deploying via Cloudflare Workers Builds**: the production Worker (script name `trillastrob`) auto-deploys from this repo through Cloudflare's git integration on every push, independent of this repo's own scripts. The Cloudflare project's **Root directory is set to `packages/bot`** — the build and deploy commands run from there, not the monorepo root. Two things to keep in sync when touching `packages/bot/wrangler.jsonc` or `packages/bot/package.json`:
- `wrangler.jsonc`'s `kv_namespaces[].id` and `d1_databases[].database_id` must be real Cloudflare resource IDs, not local-dev placeholders — an invalid ID fails the deploy step (`wrangler` rejects unknown bindings), and the failure only shows up in the Cloudflare dashboard's build log, not in this repo's CI.
- The Workers Builds pipeline runs `npm run build` before deploying, so **both** the workspace root `package.json` and `packages/bot/package.json` must define a `build` script, even though `wrangler deploy`/`versions upload` bundles the Worker itself and there's no real build step — each has a no-op `build` script for exactly this reason (the root one covers `npm run build` invoked from the repo root; the `packages/bot` one covers it being invoked with Root directory scoped there, which is what Workers Builds actually does). If either script is ever removed, the corresponding build fails with `npm error Missing script: "build"`.

The Cloudflare project's **Deploy command**, **Non-production branch deploy command** (aka Version command), and **Root directory** are dashboard-side settings for `trillastrob`, not stored in this repo — they must agree with `wrangler.jsonc`'s `main` path (`src/index.ts`, relative to `packages/bot` since that's the Root directory). Don't pass an explicit entry-point path argument to `wrangler deploy`/`wrangler versions upload` in those dashboard commands — let `wrangler.jsonc`'s `main` field govern it, the same way the (correct) production Deploy command does; a hardcoded path there can silently drift out of sync with the repo (e.g. a stale `.js` path after a TS migration) and there's no way to detect that from this repo — check the Cloudflare dashboard's build log directly if `trillastrob`'s Workers Builds check fails on a PR.

**initData verification** (`verifyTelegramInitData` in `telegramAuth.ts`): reimplements Telegram's documented HMAC-SHA256 check using only the runtime Web Crypto API (`crypto.subtle`) — no external crypto dependency. Also rejects data older than `maxAgeSeconds` (default 24h). Do not replace this with a third-party library. It's a standalone module (not defined in `index.ts`) specifically so `integrations.ts` can import it too without creating a circular `index.ts` ⇄ `integrations.ts` dependency.

**Storage layer** (`db.ts`): D1 is the source of truth; KV is a 3600s read-through/write-through cache keyed `user:{userId}`. `getUserProfile` checks KV first, falls back to D1, and repopulates KV on a D1 hit — that repopulation is registered with the route handler's `ctx.waitUntil()` (an optional `ctx` param) so the Worker runtime doesn't terminate it after the response is returned. All D1/KV errors are caught and logged, never thrown, so profile/activity failures degrade gracefully instead of breaking a request. `getLatestHighTierNarrative` reads the `agent_chat` activity log's JSON `metadata` column via SQLite's `json_extract` to find the most recent entry at or above a given Oracle tier — `handleTelegramUpdate` writes `tier`/`narrative` into that metadata alongside the existing `intent` field specifically so this query has something to filter on.

**Integrations hub** (`integrations.ts`): proxies/mocks six external services — n8n workflow hub, a Qwen3-TTS voice studio, a "NovelAI Lorebook Agent" sandbox, a Mirror-Leech Bot relay, a self-hosted Bluesky/AT Protocol PDS, and Craft Quick Capture. `GET .../status` health-checks n8n, Qwen, the Mirror-Leech Bot, the PDS (`/xrpc/_health`), and Craft over HTTP with a 2s timeout; `POST .../trigger` dispatches to one of `novelai` (mocked response), `n8n` (proxies to `${N8N_URL}/webhook/{action}`), `qwen_tts` (mocked), `mirror_leech` (mocked), `bluesky_pds`, or `craft` (proxies to the real Craft API). `NOVELAI_AGENT_PATH` is a purely informational path echoed in the status response — its default is a generic placeholder, not a real filesystem path, so set it via `.dev.vars` if you want a meaningful value locally. `mirror_leech` accepts `mirror`/`leech`/`status` actions — `mirror`/`leech` require `payload.url` and return a mocked queued-task stub (task id, engine, destination); an unrecognized action returns a 400 rather than silently defaulting to `mirror`. `bluesky_pds` accepts `describe` (a real proxy to the PDS's unauthenticated `com.atproto.server.describeServer` XRPC endpoint) and `post` (mocked — a real post needs an authenticated session, out of scope for this stub); `describe` is the one case in this hub where the proxied call isn't mocked, since it's safe and read-only, mirroring the `n8n` pattern. The `novelai`, `n8n`, `qwen_tts`, `mirror_leech`, and `bluesky_pds` (`post` action) branches are local/dev-only integrations, not production services — treat their responses as illustrative stubs when extending. `craft` is the one exception besides `bluesky_pds`'s `describe`: it's a real write to a real Craft space, so every `craft` trigger requires a valid Telegram `initData` in the request body (verified via `verifyTelegramInitData`) before it's allowed to proceed — don't add a new integration that writes to real user data without the same gate.

**Agent chain** (`agent.ts`): implements the Trill Astro Buzz persona from the Space Age Hustle universe as a four-stage Gemini-backed chain — `analyzeIntent` (ACTION vs CHAT) → `runOracleDice` (a 5-die poker-hand roll, only for ACTION) → `generateReflection` → `generateNarrative`, orchestrated by `runAgentChain` and rendered to Telegram HTML by `formatAgentMessage`. `handleTelegramUpdate` in `index.ts` invokes it for any non-`/start` text message when `GEMINI_API_KEY` is set; without that env var the bot silently only handles `/start`, matching the graceful-degradation convention used elsewhere in this file. Chain failures (bad key, Gemini API errors) are caught and logged, never thrown, so a broken chain can't take down `/webhook`. `runOracleDice` and the raw `callGemini` HTTP call live in standalone `oracle.ts`/`gemini.ts` modules (not defined in `agent.ts` itself) specifically so `rpg.ts` can reuse them without duplicating the dice algorithm or the Gemini fetch call.

**RPG game** (`rpg.ts`, `rpgDb.ts`): backend for a ported copy of [Cybersoulja/AetherRPG](https://github.com/Cybersoulja/AetherRPG) ("Aethermoor Chronicles"), a text RPG originally built as a standalone Express + Neon Postgres app. Ported into this Worker as `/api/rpg/*` — three new D1 tables (`rpg_characters`, `rpg_saves`, `rpg_leaderboard`, all keyed by `telegram_user_id`) replace AetherRPG's Postgres schema, and every route is gated by `verifyTelegramInitData` (like `craft` in `integrations.ts`) instead of AetherRPG's original bcrypt/express-session auth, since these routes write real per-user D1 rows and (for `/api/rpg/dm`) call a billed Gemini API. Routes: `POST/GET /api/rpg/characters`, `GET /api/rpg/characters/:id`, `POST /api/rpg/saves`, `GET /api/rpg/saves/:slot`, `GET /api/rpg/saves`, `GET/POST /api/rpg/leaderboard` (`GET` is the one route that doesn't require auth, matching AetherRPG's original), and `POST /api/rpg/dm`. `/api/rpg/dm` is the real-AI replacement for AetherRPG's original `AIAgentEngine`, which just picked a random line from a hand-written template table — it calls Gemini via `callGemini` for an in-character DM/merchant/ally response, falling back to one static line per persona when `GEMINI_API_KEY` isn't set (same graceful-degradation convention as the main agent chain). GET routes take `initData` as a query param (no body to carry it in); POST routes take it in the JSON body.

### Frontend (`apps/frontend/src/`)
`App.tsx` is the shell: it initializes the Telegram WebApp SDK on mount (`ready()`, `expand()`, Main Button wired to `close()`), resolves the current user from `webApp.initDataUnsafe.user` (falling back to a hardcoded mock user when not running inside Telegram, e.g. in a browser), and fetches/merges the D1 profile via `GET /api/profile`. It then renders one of five tabs selected via `TabBar` (`TabId = "dashboard" | "storage" | "integrations" | "settings" | "rpg"`), each a standalone component in `src/components/`:
- `DashboardTab` — triggers `/api/validate` to prove the HMAC handshake works, haptics demo
- `RpgTab` — the Aethermoor Chronicles RPG (see below)
- `StorageBiometricsTab` — exercises `webApp.CloudStorage` (get/set/list keys) and `webApp.BiometricManager` (init/request access/authenticate)
- `IntegrationsTab` — calls the backend's `/api/integrations/*` routes
- `SettingsTab` — lets the user change `backendUrl` at runtime and refresh their profile

`telegram.d.ts` hand-declares the Telegram WebApp SDK types (`window.Telegram.WebApp`) since there's no official `@types` package in use — extend this file when using additional SDK surface.

**Styling convention**: all colors must come from Telegram theme CSS variables (`var(--tg-theme-bg-color)`, `--tg-theme-text-color`, `--tg-theme-button-color`, etc., set in `App.css`/`index.css`) so the UI matches the user's Telegram light/dark theme automatically. Do not hardcode a light/dark palette. Tailwind (added for the RPG port, see below) follows the same rule at the config level — `tailwind.config.ts`'s color tokens (`background`, `foreground`, `card`, `primary`, `muted`, `accent`, `destructive`, `success`, `warning`, etc.) map to this same set of App.css variables, not literal colors, so classes like `bg-background`/`text-foreground`/`bg-primary` stay theme-correct. Never use Tailwind's raw palette classes (`bg-gray-900`, `text-blue-400`, etc.) in this codebase — use the semantic tokens instead, and add a new token to `tailwind.config.ts` (mapped to a CSS variable) rather than reaching for a raw color if none of the existing tokens fit.

**RPG game** (`components/RpgTab.tsx`, `components/game/*`, `lib/stores/*`, `lib/customStoryEngine.ts`, `lib/gameEngine.ts`, `lib/oracleEngine.ts`, `data/*.ts`, `types/game.ts`): a ported copy of [Cybersoulja/AetherRPG](https://github.com/Cybersoulja/AetherRPG). `RpgTab` replicates AetherRPG's original top-level `App.tsx` — a `welcome → character_creation → playing` phase machine — as one tab instead of a whole app. Zustand stores in `lib/stores/` (`useGame`, `useCharacter`, `useInventory`, `useStoryEngine`, `useOracle`, `useQuests`, `useAchievements`) hold game state; `gameEngine.ts` has the character/combat/leveling math; `customStoryEngine.ts` is the branching-narrative engine (the only story engine actually wired up — AetherRPG's dormant Ink.js path, `client/src/lib/inkStory.ts` and a `story.ink.json`, was **not** ported); `oracleEngine.ts` is a client-side five-die dice roll + canned narrative-flavor-text generator for the Oracle consultation UI (instant, no network round-trip — a separate concern from the DM chat, and not the same code as the backend's `oracle.ts`, which exists only to compute a tier server-side for `/api/rpg/dm`).

Two stores are rewrites, not ports, because their originals depended on things this repo intentionally doesn't have:
- `useAIAgents` — originally a local `AIAgentEngine` that returned a random line from a hand-written template table. Now calls the Worker's `/api/rpg/dm` (real Gemini). Has a `configure(backendUrl, initDataRaw)` action that `RpgTab`/`GameInterface` call once via `useEffect`, since a Zustand store can't read React props directly.
- `useAudio` — originally used `howler` for real sound playback; that dependency was deliberately not added (see the port's dependency-trimming notes below), so this is just an `isMuted`/`toggleMute` stub with no actual audio.

`lib/api.ts` is also a rewrite: AetherRPG's original was a class-based singleton with a fixed `baseUrl` and Express-session cookies for auth. This one is a set of functions that take `backendUrl` and `initDataRaw` explicitly per call (matching `IntegrationsTab.tsx`'s existing `handleTrigger` pattern) and hit `/api/rpg/*` instead.

**What wasn't ported from AetherRPG, and why**: its `package.json` carried a lot of unused Replit-scaffold dependencies (`three`/`@react-three/*`/`postprocessing`/`matter-js`/`pixi.js`/`meshline`/`ogl`/`gl-matrix`/`r3f-perf`/`howler`/`gsap`/`framer-motion`/`wouter`/`react-router-dom`/`react-leaflet`) — confirmed via grep that none of them were actually imported by any game component, so none were added here. Of its ~50 shadcn/Radix `components/ui/*` primitives, only the ~15 actually imported by the game components were ported (`badge`, `alert`, `progress`, `tabs`, `textarea`, `button`, `card`, `dialog`, `input`, `label`, `separator`, `sheet`, `skeleton`, `toggle`, `tooltip`) — check actual usage (`grep -rn "from '\.\./ui/"` or `"from '@/components/ui/"`) before assuming a shadcn primitive isn't needed if you're porting more UI from the same source later, since components can import it via either a relative path or the `@/` alias.

### TypeScript configuration
The bot and frontend are independently type-checked and use different configs/module resolution — `packages/bot` targets the Workers runtime (`tsc --noEmit`, `@cloudflare/workers-types`), `apps/frontend` uses project references (`tsconfig.app.json` for app code, `tsconfig.node.json` for `vite.config.ts`) and bundler module resolution (`tsc -b`). Always run `npm run check-types` from the root to check both rather than assuming one config covers the other.
