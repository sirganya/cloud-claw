# cloud-claw — Status

_Updated 2026-08-24 by Claude_

**Last done:**

- **Verified the keep-alive fix live and closed the loop autonomously.** The `gateway-client` client-id fix (beta v4 rejects custom ids) is confirmed working from inside the container: keep-alive WebSocket ESTABLISHED on port 6658, zero `invalid-handshake` errors in the gateway log. The "answers once, then dies" bug is fixed and verified.
- **Hardened the Telegram cold-start gate after a multi-agent review found two real defects** in the just-shipped `forwardWhenGatewayReady`: (1) it probed `/health`, which the gateway serves as an unconditional liveness 200 the moment the port binds — and the Telegram listener on 8787 binds *during* startup and acks webhooks 2xx, so a message could still die in a half-initialized gateway with no redelivery. Now probes `/startup` (503 until plugins/sidecars are up; deliberately not `/ready`, which also goes false on channel-health blips and would starve delivery). (2) The probe had no timeout, so a wedged-but-listening gateway (June FUSE incident pattern) would hold webhook requests forever — now bounded at 15s per probe. Both verified against the vendored gateway dist and the live gateway, deployed (version 0b53d16f), committed and pushed.
- **Cleared a stale blocker:** the "undeployed Dockerfile changes" (wake-message removal d777f46, exec-hygiene 0e7f914) actually shipped with the Aug 19 beta image — d777f46 predates the beta commit 9c00748 the image was built from. Nothing is pending a container deploy.
- Wrangler is now OAuth-authed on this machine, so Claude can deploy without Greg.

**Next planned:**

- Real-world confirm the cold-start path: first Telegram message to a sleeping container should land (Telegram retries against 503s until `/startup` goes 200).
- Measure whether exec-hygiene shrinks per-turn transcript size on Liz's heavy sessions; if not, build a `beforeToolCall` guard plugin.

**Needs from Greg:** **Rotate the Notion token `ntn_6801…16Pc`** (still in old transcripts/R2). Decide commit-vs-gitignore for untracked CLAUDE.md / scripts/ / openclaw-build/ / src/admin-html.ts / screenshot.

**What it is:** A self-hosted OpenClaw AI assistant ("Quickly") on Cloudflare Workers + Containers — a Worker handles auth/routing to a singleton container gateway and proxies CDP sessions via Browser Rendering.

**Current focus:** Beta-upgrade hardening: keep-alive and Telegram cold-start delivery are now fixed, deployed, and live-verified. Remaining theme is Gemini cost (exec-hygiene measurement).

**In flight (uncommitted):** Nothing — src changes committed and pushed. Untracked repo files (CLAUDE.md, scripts/, openclaw-build/, admin-html.ts) still awaiting Greg's commit-vs-gitignore decision.
