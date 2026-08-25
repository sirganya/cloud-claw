# cloud-claw — Status

_Updated 2026-08-25 by Claude_

**Last done:**

- **Found and fixed the real cause of "Agent couldn't generate a response":** not the beta itself but the 64k `contextTokens` cost cap from Aug 13 — sessions hit the ~45k usable budget after a few turns, the beta's mid-turn precheck found nothing to compact, and the turn hard-failed (observed live: 52.7k prompt vs 45.5k budget). Greg opted to stay on the beta rather than roll back (rollback would have meant restoring the Aug-19 data snapshot and losing 5 days of agent memory). Cap raised to **262144 (~242k usable)**; context pruning stays on as the structural cost control. Deployed and live-verified: config on the gateway, clean boot, keep-alive WS established, zero handshake errors.
- **Fixed the deploy pipeline itself to get that config out:** the single 2.9GB node_modules COPY made a >1GB blob whose registry upload died repeatedly on this uplink (same digest, broken pipe, three deploys in a row). Dockerfile now splits packages into four ~250MB layers via a throwaway build stage; pushes go through. Committed (976efef) and pushed.
- Cost check for Greg (mild daily use on Gemini 3.7 Flash promo pricing: $0.75/M in, $3.75/M out, $0.075/M cached through Dec 2026): roughly **$50–80/month**, worst case ~$120. July's $376 was runaway 1–2M contexts with no pruning at 2× today's prices. Note: prices double Jan 1, 2027.
- Previous session (Aug 24): `gateway-client` keep-alive fix verified live; Telegram webhook gate hardened to probe `/startup` with a 15s probe timeout (commit 2a8bae5).

**Next planned:**

- Watch a few real long conversations for overflow errors at the new cap (none expected below ~240k).
- Measure whether exec-hygiene + pruning keep per-turn cost near the estimate; revisit cap or add a `beforeToolCall` guard if not.

**Needs from Greg:** **Rotate the Notion token `ntn_6801…16Pc`** (still in old transcripts/R2). Decide commit-vs-gitignore for untracked CLAUDE.md / scripts/ / openclaw-build/ / src/admin-html.ts / screenshot.

**What it is:** A self-hosted OpenClaw AI assistant ("Quickly") on Cloudflare Workers + Containers — a Worker handles auth/routing to a singleton container gateway and proxies CDP sessions via Browser Rendering.

**Current focus:** Stabilizing the 2026.8.1-beta: keep-alive, Telegram cold-start delivery, and the context-cap failure are all fixed and live-verified. Remaining theme is confirming real-world cost/reliability at the 256k cap.

**In flight (uncommitted):** Nothing — clean tree apart from the long-standing untracked files awaiting Greg's decision.
