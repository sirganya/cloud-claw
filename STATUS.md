# cloud-claw — Status
_Updated 2026-08-14 by Claude_

**Last done:**
- Fixed an "impossibly slow for Liz" report — root cause was a **compaction loop** introduced by the Aug-13 fix. The `maxActiveTranscriptBytes: 524288` (512KB) guard was set *below* a session's irreducible floor, so every turn compacted, produced a still-693KB file, and re-compacted 3–6× per burst (18 compactions in one session, all empty "conversation history is empty" summaries — each a wasted Gemini call). Removed `maxActiveTranscriptBytes` + `truncateAfterCompaction`; kept `midTurnPrecheck`, `contextPruning`, and `contextTokens: 65536`. Deployed (version 78) + verified live: gateway 200, config correct.
- Archived Liz's 108 loop-artifact checkpoint files (66MB) to `/data/agents/main/sessions-archive-compaction-loop/` on the container so her next message starts clean.
- **Fixed the per-turn bloat at the source (behavioral).** Added a marker-guarded `cloud-claw:exec-hygiene` block to the workspace AGENTS.md via the Dockerfile entrypoint: never inline datasets/secrets into `exec`/node args (write to a file, pass the path; read the Notion token from `process.env`), scope greps, prefer script-by-path over long one-liners. Applied live via SSH to the R2-backed AGENTS.md (takes effect immediately, marker guard prevents double-append on next deploy) and committed in the Dockerfile for durability. This targets the ~170k tokens/turn the agent was re-sending — args that `midTurnPrecheck` can't trim.

**Next planned:**
- Watch whether the AGENTS.md instruction actually changes agent behavior; if not, tighten it or archive the workspace clutter (300+ ad-hoc scripts, `dump_leads.json` 466KB, big images) so there's less to inline in the first place.
- Re-measure trajectory token usage now that both the loop and the inlining are addressed, vs the 0.5M–2.3M baseline.

**Needs from Greg:** **Rotate the Notion integration token `ntn_6801…16Pc`** — it's sitting in plaintext in old session transcripts + R2 backups (the new AGENTS.md rule stops *future* inlining but can't scrub the past). Decide whether CLAUDE.md, scripts/, openclaw-build/ should be committed or gitignored (still untracked).

**What it is:** A self-hosted OpenClaw AI assistant running on Cloudflare Workers + Containers, with a Worker handling auth/routing to a singleton container gateway and proxying CDP sessions via Browser Rendering.

**Current focus:** Gemini cost control — specifically stopping the agent from re-sending huge contexts every turn, now addressed at the mechanism level (pruning + compaction) rather than just capping the token window.

**In flight (uncommitted):** The compaction-loop fix + the new exec-hygiene block (both Dockerfile) are now committed and pushed. Still untracked (undecided — commit vs gitignore): the stubbed admin pairing UI (src/admin-html.ts served at /admin + scripts/admin-api.mjs on port 6659), CLAUDE.md, scripts/build-dist.sh, openclaw-build/ checkout, a screenshot, .DS_Store.
