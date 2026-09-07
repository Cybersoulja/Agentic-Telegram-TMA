---
name: run-agentic-telegram-tma
description: Build, run, and drive the Agentic Telegram Mini App (TMA) — the Cloudflare Worker bot backend (packages/bot) and the Vite/React frontend (apps/frontend) — headlessly in this container. Use when asked to run, start, launch, test, or screenshot the bot, the backend, the frontend, or the mini app.
---

# Run: Agentic Telegram Mini App

Two processes make up this prototype, run together for the full experience:

- **Backend** — a Cloudflare Worker (`packages/bot`), served locally via `wrangler dev` with D1/KV **simulated locally by Miniflare** (no live Cloudflare account needed for dev).
- **Frontend** — a Vite/React SPA (`apps/frontend`). Outside Telegram (i.e. in a plain browser) it automatically falls back to a **hardcoded mock user** (`App.tsx`'s `setMockUser()`), so it's fully drivable headless without a real Telegram session.

All paths below are relative to the repo root (`<unit>/`), which is where this skill's directory (`.claude/skills/run-agentic-telegram-tma/`) itself lives.

## Agent path (primary): curl for the backend, Playwright driver for the frontend

### 1. Install deps (once)

```bash
npm install   # from repo root — installs both workspaces
(cd .claude/skills/run-agentic-telegram-tma && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install)   # driver's isolated deps — NOT covered by the root install
```

The skill's own `node_modules` (Playwright) is deliberately excluded from the root npm workspaces and is gitignored, so a fresh checkout needs that second install too — see Gotchas.

### 2. Backend: `wrangler dev`

```bash
cd packages/bot
cp .dev.vars.example .dev.vars   # if not already present; a fake bot token is fine for local dev
npx wrangler dev --port 8787 &
```

Wait for `[wrangler:inf] Ready on http://localhost:8787` in the output, then drive it with plain `curl`:

```bash
curl -sS http://localhost:8787/                          # health check
curl -sS http://localhost:8787/api/db/init                # idempotent — creates users/activity_logs tables
curl -sS -X POST http://localhost:8787/api/profile \
  -H 'Content-Type: application/json' \
  -d '{"id":123456789,"first_name":"Trill","theme_preference":"dark-sci-fi"}'
curl -sS "http://localhost:8787/api/profile?userId=123456789"
curl -sS "http://localhost:8787/api/integrations/status"
```

### 3. Frontend: Vite dev server + the Playwright driver in this skill

```bash
cd apps/frontend
npx vite --port 5173 --host &
```

Wait for `VITE ... ready` / `Local: http://localhost:5173/`, then drive it with `driver.mjs` in this skill directory (already has `playwright` installed locally — see Gotchas):

```bash
cd .claude/skills/run-agentic-telegram-tma
node driver.mjs open http://localhost:5173 /tmp/dashboard.png
node driver.mjs click-text http://localhost:5173 "Validate Launch Data" /tmp/validate.png
node driver.mjs click-text http://localhost:5173 "Cloud & Bio" /tmp/storage.png
node driver.mjs click-text http://localhost:5173 "Oneseco Hub" /tmp/integrations.png
node driver.mjs click-text http://localhost:5173 "Settings" /tmp/settings.png
```

Driver commands (see `driver.mjs` header for full details):
- `open <url> <screenshot.png>` — navigate, wait for `#root`, screenshot
- `click-text <url> <visible text> <screenshot.png>` — click the first element containing that text, screenshot after a short settle delay
- `click-tab <url> <tabId> <screenshot.png>` — same idea, tries a `data-tab-id` selector first, falls back to text match
- `eval <url> "<js expression>"` — run a JS expression in page context, print the JSON result

Each invocation launches a fresh headless Chromium (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), loads the page, does one action, and closes — so you always get a clean screenshot per call rather than juggling a persistent session.

### 4. Type-check and lint (non-interactive sanity check, not the main event)

```bash
npm run check-types             # from repo root — checks both workspaces
npm run lint --workspace=apps/frontend
```

### 5. Shut down

Don't use a bare `pkill -f "wrangler dev"` / `pkill -f "vite"` — on a shared machine that matches (and kills) unrelated processes with the same command line. Scope by working directory instead:

```bash
ROOT="$(git rev-parse --show-toplevel)"
for pid in $(pgrep -f "wrangler dev"); do
  [ "$(readlink "/proc/$pid/cwd")" = "$ROOT/packages/bot" ] && kill "$pid"
done
for pid in $(pgrep -f "vite --port 5173"); do
  [ "$(readlink "/proc/$pid/cwd")" = "$ROOT/apps/frontend" ] && kill "$pid"
done
```

## Human path

```bash
npm run dev:bot        # wrangler dev on :8787, separate terminal
npm run dev:frontend   # vite on :5173, separate terminal
```

Open `http://localhost:5173` in a real browser. Useless headless — no window will appear in this container.

## Gotchas

- **`playwright` is not a repo dependency.** It's installed locally inside this skill directory only (`.claude/skills/run-agentic-telegram-tma/node_modules`), via `npm install playwright` run from *inside this skill directory* — deliberately isolated from the main workspace's `package.json`/`package-lock.json` so the driver doesn't leak a test-framework dependency into the product. If `node_modules` is missing here, reinstall with:
  ```bash
  cd .claude/skills/run-agentic-telegram-tma && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install playwright
  ```
  (The env var skips Playwright's own browser download — this container already has Chromium at `/opt/pw-browsers`.)
- **The mock user's `initData` always fails validation.** `App.tsx`'s fallback mock sets `auth_date=123` (i.e. 1970), so clicking "Validate Launch Data" on the Dashboard tab **correctly** gets rejected by the backend with `"Init data expired (request created > 24 hours ago)"` (visible as a red error box, HTTP 403). This is the real HMAC/freshness check in `telegramAuth.ts` working as designed — it is not a bug, and it's the expected screenshot outcome. Don't mistake it for the driver or backend being broken.
- **The Cloudflare `Request.cf` warnings and `net::ERR_CONNECTION_RESET` / `ERR_TUNNEL_CONNECTION_FAILED` console noise are container/proxy artifacts**, not real Worker or app errors — they come from Miniflare's dev-mode `cf` object fetch and this sandbox's outbound proxy respectively. Ignore them as long as the actual HTTP responses (checked via `curl` / the driver's `result`/`logs`) are correct.
- **`wrangler dev` prints a "Duplicate key build" warning** from esbuild parsing both the root and `packages/bot` `package.json` — harmless, expected per this repo's dual-`wrangler.jsonc` setup (see root `CLAUDE.md`).
- **POST `/api/profile` expects `id`, not `userId`,** in the JSON body (GET uses `?userId=`). Passing `userId` in the POST body silently fails with `"User profile ID is required."`
- **D1/KV are simulated locally** by Miniflare — you do not need real Cloudflare credentials or the actual `kv_namespaces`/`d1_databases` IDs in `wrangler.jsonc` to point at live resources for local dev; `wrangler dev` creates a local SQLite-backed simulation automatically.
- **Frontend defaults to `http://localhost:8787`** for the backend (`VITE_API_URL` env var, else that hardcoded default in `App.tsx`) — matches the backend port used above, no extra config needed for local dev.
- **`wrangler@3.114` is out of date** (repo pins `^3.100.0`); it emits an upgrade nag and falls back the requested `compatibility_date` from `2026-07-01` to the runtime's max supported `2025-07-18`. Cosmetic — doesn't affect any of the above.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npx wrangler dev` never prints "Ready on http://localhost:8787" | Check `packages/bot/.dev.vars` exists (copy from `.dev.vars.example`) — wrangler still boots without it, but confirm no port conflict on 8787 (`lsof -i :8787`) |
| Driver script throws `Cannot find module 'playwright'` | You're running `node driver.mjs` from somewhere other than `.claude/skills/run-agentic-telegram-tma`, or that dir's own `node_modules` is missing — see Gotchas above |
| Screenshot shows a blank white page | Vite dev server likely isn't up yet — `curl -sS http://localhost:5173` first to confirm it responds before driving it |
| `click-text` times out finding an element | The visible label changed, or you're matching text that appears more than once — check the current tab labels in a fresh `open` screenshot first (`Dashboard`, `Cloud & Bio`, `Oneseco Hub`, `Settings`) |
