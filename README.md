# Agentic-Telegram-TMA

A full-stack Telegram Mini App (TMA) — a multi-tab "control hub" launched from a Telegram bot's `web_app` button. A single Cloudflare Worker backs both the Telegram bot and a React SPA frontend, with a Gemini-powered agent persona, a ported text RPG, and a hub of external-service integrations all living in one repo.

- **Live bot:** [@TrillAstroBot](https://t.me/TrillAstroBot)
- **License:** MIT (see [`LICENSE`](./LICENSE))

## What's in here

Open the Mini App from the bot and you get five tabs:

| Tab | What it does |
|---|---|
| **Dashboard** | Exercises the Telegram `initData` HMAC handshake (`/api/validate`) and a haptics demo |
| **Aethermoor Chronicles** | A full text RPG — character creation, combat, inventory, quests, a Gemini-backed DM/NPC chat, and a leaderboard — ported from [Cybersoulja/AetherRPG](https://github.com/Cybersoulja/AetherRPG) |
| **Storage & Biometrics** | Exercises the Telegram WebApp `CloudStorage` and `BiometricManager` APIs |
| **Integrations** | A hub of six external-service proxies/stubs (see below), plus a "Mission Log Broadcast" that chains three of them together |
| **Settings** | Change the backend URL at runtime, refresh your profile |

Talk to the bot directly (any message other than `/start`) and — if a Gemini API key is configured — it replies in-character as **Trill Astro Buzz**, a persona from the *Space Age Hustle* universe, via a four-stage LLM chain: intent detection → an Oracle dice roll → reflection → narrative.

The **Integrations Hub** proxies or mocks: an n8n workflow hub, a Qwen3-TTS voice studio, a "NovelAI Lorebook Agent" sandbox, a Mirror-Leech download bot, a self-hosted Bluesky/AT Protocol PDS, and Craft Quick Capture (the one integration that performs a real write to a real Craft space). Most of these are local/dev-only stubs by design — see [`CLAUDE.md`](./CLAUDE.md) for exactly which calls are real vs. mocked.

## Architecture

```
┌─────────────────────┐        webhook / API calls        ┌──────────────────────────┐
│   Telegram clients   │ ─────────────────────────────────▶│  Cloudflare Worker       │
│  (bot chat + Mini    │◀───────────────────────────────── │  packages/bot/           │
│   App WebView)       │        bot replies / JSON          │  (single fetch handler)  │
└─────────────────────┘                                     └───────────┬──────────────┘
                                                                          │
                          apps/frontend/ (React 19 + Vite SPA)           │ D1 (SQL) + KV (cache)
                          served as the Mini App's web_app URL           │ Gemini API
                                                                          ▼
                                                              Cloudflare D1 / KV / Gemini
```

- **Backend** (`packages/bot/`): one Cloudflare Worker (TypeScript), no router library — a single `fetch` handler in `index.ts` manually dispatches on `url.pathname` + method. Handles the Telegram webhook, verifies `initData` via HMAC-SHA256 (`telegramAuth.ts`), and persists profiles/activity/RPG state to D1 with a KV read-through cache (`db.ts`).
- **Frontend** (`apps/frontend/`): a Vite + React 19 + TypeScript SPA styled entirely with Telegram's native theme CSS variables, using the Telegram WebApp SDK for haptics, the Main Button, CloudStorage, and BiometricManager.
- **Package manager**: npm workspaces (`packages/*`, `apps/*`).

For the full architectural deep-dive — every route, every module's responsibility, the RPG port's specifics, the styling conventions, the Cloudflare Workers Builds deploy setup — see [`CLAUDE.md`](./CLAUDE.md) (also read by Claude Code) and [`AGENTS.md`](./AGENTS.md). This README stays at the "what is this and how do I run it" level on purpose.

## Prerequisites

- Node.js and npm
- A [Telegram bot token](https://core.telegram.org/bots#how-do-i-create-a-bot) from [@BotFather](https://t.me/BotFather)
- (Optional) A [Gemini API key](https://ai.google.dev/) to enable the Trill Astro Buzz agent chain and the RPG's DM chat
- (Optional) A Cloudflare account, if you want to deploy rather than just run locally

## Getting started

```bash
npm install
```

Create `packages/bot/.dev.vars` (gitignored) from the example file:

```bash
cp packages/bot/.dev.vars.example packages/bot/.dev.vars
```

At minimum, set:

```ini
TELEGRAM_BOT_TOKEN="your_bot_token"
MINI_APP_URL="http://localhost:5173"
```

Everything else in `.dev.vars.example` is optional and defaults to local placeholders — see the comments in that file for the integrations hub's env vars (`N8N_URL`, `QWEN_TTS_URL`, `NOVELAI_AGENT_PATH`, `MIRROR_LEECH_URL`, `BLUESKY_PDS_URL`, `CRAFT_API_URL`) and `GEMINI_API_KEY`.

Then, in two terminals:

```bash
npm run dev:bot         # wrangler dev — backend Worker on :8787
npm run dev:frontend    # vite dev — frontend on :5173
```

The frontend defaults to `http://localhost:8787` as its backend URL (`VITE_API_URL`, overridable at runtime from the Settings tab). Open `http://localhost:5173` in a browser to use the Mini App outside of Telegram (it falls back to a mock user when not running inside the Telegram WebView).

To actually wire the bot up to Telegram, deploy the Worker first (see below), then hit `GET /setup-webhook` on the deployed URL to register it.

The first time you point the Worker at a real D1 database, hit `GET /api/db/init` once to create its tables.

## Commands

Run from the repo root unless noted:

```bash
npm install                    # install all workspace deps

npm run dev:bot                # wrangler dev, backend Worker on :8787
npm run dev:frontend           # vite dev, frontend on :5173

npm run check-types            # type-checks both workspaces (tsc -b / tsc --noEmit)
npm run build:frontend         # tsc -b && vite build (apps/frontend)
npm run deploy:bot             # wrangler deploy (packages/bot)
```

Per-workspace:

```bash
npm run lint --workspace=apps/frontend         # oxlint
npm run check-types --workspace=packages/bot   # tsc --noEmit
npm run check-types --workspace=apps/frontend  # tsc -b
```

There is no test suite in this repo currently — type-checking is the main safety net.

## Project structure

```
├── apps/frontend/            React 19 + Vite SPA (the Mini App)
│   └── src/
│       ├── components/       DashboardTab, RpgTab, StorageBiometricsTab,
│       │                     IntegrationsTab, SettingsTab, TabBar
│       ├── components/game/  Aethermoor Chronicles RPG UI
│       ├── components/ui/    shadcn/Radix primitives (only the ones actually used)
│       ├── lib/stores/       Zustand stores for RPG game state
│       ├── data/             RPG static game data
│       └── types/            RPG type definitions
├── packages/bot/             Cloudflare Worker (the backend)
│   └── src/
│       ├── index.ts          fetch handler + route dispatch + Telegram webhook
│       ├── db.ts             D1/KV storage layer
│       ├── telegramAuth.ts   initData HMAC verification + auth gate
│       ├── integrations.ts   the Integrations Hub (6 services)
│       ├── agent.ts          Trill Astro Buzz Gemini agent chain
│       ├── oracle.ts         shared dice-roll logic
│       ├── gemini.ts         raw Gemini HTTP call
│       ├── rpg.ts / rpgDb.ts RPG backend (/api/rpg/*)
│       └── wrangler.jsonc    canonical Worker config (local dev + deploy)
├── docs/                     project plans, handoff notes
├── wrangler.jsonc            root-level copy for Cloudflare Workers Builds CI (see CLAUDE.md)
├── CLAUDE.md / AGENTS.md     detailed architecture reference for AI coding agents
└── package.json              npm workspaces root
```

## Deployment

The production Worker (`trillastrob`) auto-deploys from this repo via Cloudflare Workers Builds' git integration on every push to `main` — there's no manual deploy step for production. `npm run deploy:bot` is there for deploying your own instance to your own Cloudflare account.

Deploying to your own account requires:
1. A Cloudflare D1 database and KV namespace, with their real IDs set in `packages/bot/wrangler.jsonc`'s `d1_databases`/`kv_namespaces` (the checked-in placeholders are dev-only and will fail a real `wrangler deploy`).
2. `wrangler secret put TELEGRAM_BOT_TOKEN` (and `GEMINI_API_KEY`/`CRAFT_API_URL` if you want those features live).
3. Hosting the frontend build (`npm run build:frontend`) somewhere and pointing `MINI_APP_URL` at it.

See the "Cloudflare Workers Builds" section of `CLAUDE.md` for the CI-specific gotchas (the root-level `wrangler.jsonc`, the no-op `build` scripts, dashboard-side config that can't be inspected from this repo).

## Contributing

Source changes go through a pull request; documentation-only changes (`CLAUDE.md`, `AGENTS.md`, `README.md`) go straight to `main`. If you're using Claude Code or another AI coding agent against this repo, read `CLAUDE.md`/`AGENTS.md` first — they document conventions (styling, auth gating, graceful-degradation patterns) that aren't always obvious from the code alone.
