# cloud-claw — Status
_Updated 2026-08-06 by Claude_

**Last done:**
- Cost cuts: lead-scout cron disabled and agent context capped to reduce Gemini costs (last commit, ~5 days ago).
- Persistence and infra hygiene: gog CLI state persisted to /data with R2 backup, wrangler bumped to 4.107, stale dist/ artifacts removed, config drift from the deployed Worker reconciled.
- Stabilized the container lifecycle: keeps awake through long cron runs, cron wake times aligned to the actual gateway job schedule, business-hours keep-alive, FUSE watchdog and /restart endpoint.
- Got Google Chat working properly: DWD auth for the chat bridge, top-level reply threading, monitoring a second Chat space, and fixing the new-thread-on-every-reply bug (after several patch/revert cycles).

**Next planned:**
- Build out the stubbed admin pairing UI/API (src/admin-html.ts + scripts/admin-api.mjs, moltworker as the pattern) — or delete the stubs.
- Verify the Gemini cost caps actually reduced spend.

**Needs from Greg:** Push — master is 30 commits ahead of origin. Also decide whether CLAUDE.md, scripts/, and openclaw-build/ should be committed or gitignored.

**What it is:** A self-hosted OpenClaw AI assistant running on Cloudflare Workers + Containers, with a Worker handling auth/routing to a singleton container gateway and proxying CDP sessions via Browser Rendering.

**Current focus:** Cost control and operational stability — most recently disabling the lead-scout cron and capping agent context to cut Gemini API spend, after a long stretch of Google Chat integration hardening.

**In flight (uncommitted):** An admin UI for device pairing management — src/admin-html.ts (page served at /admin) and scripts/admin-api.mjs (container-side API on port 6659) are both TODO stubs. Also untracked: CLAUDE.md, scripts/build-dist.sh, a local openclaw-build/ source checkout, a screenshot, and .DS_Store.
