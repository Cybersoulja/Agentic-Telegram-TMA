# Handoff Note

Last updated: 2026-09-01, by a Claude Code session (see `CLAUDE.md` / `AGENTS.md` for full architecture docs — this note is status/context, not a duplicate of those).

## Where things stand

`main` is green: the Cloudflare Workers Builds deploy (`trillastrob`) is passing, both workspaces type-check clean, and the Integrations Hub has six working services (n8n, Qwen3-TTS, NovelAI, Mirror-Leech, Bluesky PDS, Craft Quick Capture) plus the Trill Astro Buzz Gemini agent chain.

Recently merged: PR #9 (AI Plaza doc + a chain of Cloudflare deploy-config fixes), PR #8 (root `wrangler.jsonc`), PR #3 (Craft Quick Capture, rebased onto current `main` after a large merge-conflict resolution — see commit `60b0058`/`778aa22`).

## Open PRs needing attention

- **#7 — "Prototype a Mission Log Broadcast chaining agent chain -> TTS -> Bluesky"** (`claude/mission-log-prototype`). Real, tested feature work, but its base predates the Craft integration and all the wrangler/build-config fixes — it now has merge conflicts in 7 files (`CLAUDE.md`, `IntegrationsTab.tsx`, both `package.json`s, `packages/bot/src/index.ts`, `packages/bot/src/integrations.ts`, `packages/bot/wrangler.jsonc`). Same shape of conflict as PR #3 had; resolve the same way — merge `main` in, combine both sides rather than picking one, re-run `npm run check-types` before pushing.
- **#10 — "Add codebase analysis report"** (draft, opened by an external agent called "Jules", not by a Claude session). Adds `ANALYSIS.md`. Draft state — not reviewed, not touched by this session. Worth a look before merging since it wasn't written with the repo's actual conventions in hand (worth cross-checking against `CLAUDE.md` the way PR #7's original description flagged doing).

## Known landmines

- **Root-level `wrangler.jsonc`** (added by PR #8) has `"name": "telegram-mini-app-bot"`, which does **not** match the actually-deployed Worker (`trillastrob`, per `packages/bot/wrangler.jsonc`). It's currently harmless/unused because the Cloudflare dashboard's Workers Builds project has **Root directory set to `packages/bot`**, so Cloudflare never reads the root file — but if that dashboard setting is ever reverted to `/`, this file's stale `name` will resurface deploy problems. Keep both files' `vars`/bindings in sync when either changes (there's a comment in the root file itself as a reminder).
- **Cloudflare dashboard config lives outside this repo** and can't be inspected or changed via any tool available in this session — only observed indirectly through build logs pasted by the human, or changed by the human directly. If a "Workers Builds: trillastrob" check fails on a future PR, ask for the build log text (Cloudflare dashboard → the failed build → View logs) rather than assuming a repo-side cause; several past failures here were dashboard-side (Deploy command, Root directory), not code bugs.
- **GitHub wiki is not reachable from this session.** The git proxy used here only authorizes the main repo path, not `<repo>.wiki.git` — confirmed via a 401 from `git clone`. Wiki content has to be pasted in manually via the GitHub web UI; draft pages live only in chat history unless the user saves them.
- **Real credentials were pasted into chat during a prior session** (Cloudflare API token, a GitHub PAT named "GITHUB_GOD", a Craft API token/URL). None were used for anything beyond the Cloudflare KV/D1 lookups they were needed for at the time. If those tokens are still live, they should be rotated — this note is here so a future session doesn't assume they're safe to reuse from scrollback.

## Conventions to keep following

- Docs-only changes (`CLAUDE.md`, `AGENTS.md`, `README.md`, this file) go straight to `main`, no PR — per `CLAUDE.md`'s own git workflow section.
- Source changes go through a PR on a `claude/*` branch, watched via `subscribe_pr_activity` until merged or closed.
- Always run `npm run check-types` (both workspaces) before pushing backend/frontend changes; `npm run lint --workspace=apps/frontend` for frontend-only changes.
- When a Cloudflare Workers Build check fails on a PR, don't guess — ask for the build log (the check only exposes a dashboard link, not log text, to any tool in this session).
