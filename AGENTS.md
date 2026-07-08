# Agent Development Guidelines

Development guidelines for AI coding agents working on Cloud Claw.

## Project Overview

Cloud Claw is a TypeScript project running on Cloudflare Workers + Containers. It uses Durable Objects with `@cloudflare/containers` to manage containerized AI assistant workloads.A Worker handles routing/auth, forwards requests to a singleton container running an OpenClaw gateway instance, and proxies Chrome DevTools Protocol (CDP) sessions via Cloudflare Browser bindings.

**Tech Stack:** Cloudflare Workers, TypeScript (ES2024), pnpm (v10.28.2)

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start local dev server (binds 0.0.0.0)
pnpm deploy           # Deploy to Cloudflare
pnpm lint             # Run formatter (oxfmt) + linter (oxlint)
pnpm cf-typegen       # Regenerate Cloudflare type definitions
npx oxfmt             # Format only
npx oxlint            # Lint only
```

**No test suite configured.** Validate changes with `pnpm lint` and `pnpm dev`.

## Project Structure

```
src/
├── index.ts          # Workers entry point (ExportedHandler), routing, basic auth
├── container.ts      # AgentContainer class (extends Container), WebSocket gateway
└── cdp.ts            # Chrome DevTools Protocol proxy (chunked binary WebSocket framing)

wrangler.jsonc        # Wrangler config (containers, bindings, placement)
tsconfig.json         # TypeScript config (ES2024, strict, bundler resolution)
Dockerfile            # Container image: OpenClaw gateway + TigrisFS S3 mount
worker-configuration.d.ts  # Auto-generated Cloudflare bindings (DO NOT EDIT)
.oxfmtrc.json         # Formatter config (single quotes, no semicolons, spaces)
```

## Code Style

### Formatting (oxfmt — `.oxfmtrc.json`)

- **Single quotes**, **no semicolons**, **spaces for indentation** (oxfmt overrides `.editorconfig`)
- **LF line endings**, always insert **final newline**
- Run `pnpm lint` before committing

### TypeScript

- **Target**: ES2024, **Module**: ES2022, **Resolution**: Bundler
- **Strict mode**: Enabled — **No emit** (Wrangler bundles)

### Imports

```typescript
// 1. Cloudflare imports first
import { env } from 'cloudflare:workers'
import { Container } from '@cloudflare/containers'
// 2. Local imports
import { proxyCdp } from './cdp'
// 3. Re-exports from index.ts
export { AgentContainer } from './container'
```

Use **named imports**; avoid default exports except the main handler.

### Naming Conventions

| Element    | Convention       | Example                    |
| ---------- | ---------------- | -------------------------- |
| Files      | kebab-case       | `my-file.ts`               |
| Classes    | PascalCase       | `AgentContainer`           |
| Functions  | camelCase        | `handleFetch`              |
| Constants  | camelCase/UPPER  | `PORT`, `textEncoder`      |
| Env vars   | UPPER_SNAKE_CASE | `SERVER_PASSWORD`          |
| Interfaces | PascalCase       | `ContainerConfig` (no `I`) |

### Type Patterns

```typescript
const value = env.MY_VAR  // typed as Cloudflare.Env
export default { fetch: handleFetch } satisfies ExportedHandler<Cloudflare.Env>
async function handleFetch(request: Request): Promise<Response> { ... }
```

### Error Handling

```typescript
// HTTP errors — return Response, no exceptions
return new Response('Unauthorized', { status: 401 })

// Guard clauses with early returns
const authError = verifyBasicAuth(request)
if (authError) return authError

// Logging: console.error (errors), console.warn (warnings), console.info (info)
// Bare catch for non-critical errors: try { JSON.parse(data) } catch {}
// Reconnection: setTimeout(() => this.watchContainer(), 30_000)
```

### Cloudflare Patterns

```typescript
// Durable Object Container
export class AgentContainer extends Container {
  sleepAfter = '10m'
  defaultPort = 6658
  envVars = { ... }
  override async onStart(): Promise<void> { ... }
}

// Singleton pattern
const id = env.AGENT_CONTAINER.idFromName('cf-singleton-container')
const container = env.AGENT_CONTAINER.get(id, { locationHint: 'wnam' })

// WebSocket from container
const res = await this.containerFetch(url, { headers: { Upgrade: 'websocket' } })
res.webSocket.accept()

// Browser binding (CDP proxy)
const res = await browser.fetch('http://cloudflare.browser/v1/acquire')
```

## Environment Variables

| Variable                 | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `SERVER_USERNAME`        | Basic auth username                         |
| `SERVER_PASSWORD`        | Basic auth password (empty = auth disabled) |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway access token                        |
| `WORKER_URL`             | Worker's public URL (for CDP proxy config)  |
| `S3_ENDPOINT`            | S3-compatible storage endpoint              |
| `S3_BUCKET`              | S3 bucket name                              |
| `S3_ACCESS_KEY_ID`       | S3 access key                               |
| `S3_SECRET_ACCESS_KEY`   | S3 secret key                               |
| `S3_PREFIX`              | S3 key prefix (optional)                    |

**Bindings** (in `wrangler.jsonc`):

| Binding           | Type           | Purpose                        |
| ----------------- | -------------- | ------------------------------ |
| `AGENT_CONTAINER` | Durable Object | Container lifecycle management |
| `BROWSER`         | Browser remote | Cloudflare Browser Rendering   |

## Language Requirements

**All code content MUST be in English:** commit messages, comments, logs, variable names.

## Best Practices

1. **Keep handlers thin** — Delegate to focused functions
2. **Use early returns** — For auth and validation checks
3. **Avoid over-engineering** — Simple, readable code; small focused project
4. **Comments explain why** — Not what the code does
5. **Regenerate types** — Run `pnpm cf-typegen` after changing `wrangler.jsonc` bindings
6. **Numeric separators** — Use `30_000` not `30000`
7. **No unused code** — oxlint will catch it

## Common Tasks

**Adding an env variable:** Update `wrangler.jsonc` → `pnpm cf-typegen` → Use via `env.NEW_VAR`

**Container behavior:** Edit `src/container.ts` — properties: `sleepAfter`, `defaultPort`, `envVars`; method: `onStart()`

**Request routing:** Edit `src/index.ts` — `handleFetch()` dispatches by URL pattern

**CDP proxy:** Edit `src/cdp.ts` — chunked binary WebSocket framing between client and Browser binding

**Handler pattern:** `export default { fetch: handleFetch } satisfies ExportedHandler<Cloudflare.Env>`

---

## OpenClaw Config

### Config is rewritten on every boot

`entrypoint.sh` writes `/data/openclaw.json` from a template on every container
start. Any runtime edits to that file are lost on redeploy or restart. All
config changes must go in the **Dockerfile**.

The entrypoint has two config phases:

1. A `cat > openclaw.json` heredoc for the base structure (gateway, agents defaults, browser)
2. A `node -e "..."` block that patches channels, plugins, and session settings

Channel-specific config (googlechat, telegram, etc.) belongs in the node block.

### Google Chat channel config

Working config as of 2026-07:

```javascript
c.channels.googlechat = {
  enabled: true,
  name: 'Quickly',
  serviceAccountFile: '$STATE_DIR/googlechat-sa.json',
  audienceType: 'app-url',
  audience: '${WORKER_URL}/googlechat',
  webhookPath: '/googlechat',
  appPrincipal: '103119841339856136234',
  botUser: 'users/103119841339856136234', // required for @mention detection
  dm: { policy: 'open', enabled: true, allowFrom: ['*'] },
  groupPolicy: 'open',
  groupAllowFrom: ['*'], // must be ['*'], empty array silently drops all messages
  replyToMode: 'all', // 'off' (default) strips thread ID → new thread each reply
  typingIndicator: 'none', // 'message' mode posts placeholder in wrong thread
  groups: { 'spaces/AAQAdFhXWNQ': { enabled: true, requireMention: false } },
}
```

#### Settings that matter

**`botUser`** — required for @mention detection. Value is `users/<appPrincipal>`.
Without it the bot receives space messages but cannot detect mentions.

**`groupAllowFrom`** — must be `['*']`. An empty array or missing field silently
drops all inbound space messages (no error, no log).

**Google Chat platform limitation** — apps cannot passively monitor all messages
in a space via the standard webhook. Google Chat only sends webhook events when
the app is @mentioned.

To monitor ALL space messages, the container runs a Chat REST API polling bridge
(`/usr/local/lib/chat-bridge.mjs`) that polls `GET /v1/{space}/messages` every 5 seconds.

### Chat bridge setup (one-time)

```bash
# Space resource name to monitor
wrangler secret put GOOGLE_CHAT_SPACE
# Enter: spaces/AAQAdFhXWNQ

# Workspace user the bridge impersonates for polling (must be a member of the space)
wrangler secret put GOOGLE_CHAT_IMPERSONATE_USER
# Enter: you@your-domain.com
```

**Domain-wide delegation (required):** `spaces.messages.list` does NOT accept the app
scope (`chat.bot`) — polling must use user auth. In Google Admin console →
Security → Access and data control → API Controls → Domain-wide Delegation, authorize
the service account's **client ID** (`client_id` in `googlechat-sa.json`) for the scope
`https://www.googleapis.com/auth/chat.messages.readonly`. The bridge then mints user
tokens by impersonating `GOOGLE_CHAT_IMPERSONATE_USER` (jwt-bearer with `sub` claim).
If DWD is not set up, polling fails with 403 and the bridge logs the setup steps.

No Pub/Sub or Workspace Events API required.

**How the bridge works:**

- Polls `chat.googleapis.com/v1/{space}/messages` every 5 seconds with a DWD user token,
  using `filter=createTime > "<last seen>"` + `orderBy=createTime ASC` (paginated)
- Resolves the space's `spaceType` once at startup via `spaces.get` (app token, `chat.bot`)
- Skips bot-authored messages (loop prevention)
- Skips messages that @mention the bot (delivered by direct webhook — avoids double
  processing); mentions of other users are still forwarded
- New messages are forwarded to `localhost:6658/googlechat` as synthetic MESSAGE events
  using a Google-signed OIDC token from the service account (audience = `WORKER_URL/googlechat`)
- Waits for the OpenClaw gateway to be healthy before polling

**Auth:** A dist patch (`targets-*.js`) extends OpenClaw's webhook JWT verification to also
accept the bridge's own service account email — pinned exactly via `CHAT_BRIDGE_SA_EMAIL`,
which the entrypoint exports from `googlechat-sa.json` at boot. The token must still be
validly Google-signed with the correct audience URL. (A broader suffix match on
`*.iam.gserviceaccount.com` would let any GCP service account inject messages.)

Usage pattern for space conversation:

1. Send any message in the space → bridge detects it, bot responds in that thread ✓
2. @mention messages also work and are handled by the direct webhook path

**`replyToMode`** — controls threading of bot replies. Valid values (confirmed in
OpenClaw source `extensions/googlechat/src/channel.adapters.ts`):

- `'off'` (default) — strips thread ID; every bot reply creates a new top-level thread
- `'all'` — bot replies in the same thread as the triggering message
- `'first'` — only threads the first reply

Use `'all'` for normal conversational behaviour in a space.

**`typingIndicator`** — `'message'` (default) posts a "…is typing" placeholder
using `replyThreadName` directly from the raw webhook event (correctly cased),
then **edits** it with the actual reply. This keeps everything in the correct
thread without touching `payload.replyToId` at all for text replies. Leave at
the default unless there is a specific reason to disable it.

**`groups`** keys must be the exact space resource name from Google Chat
(`spaces/AAQAdFhXWNQ`). Case-sensitive in config.

**`groupPolicy`** valid values: `"open"`, `"disabled"`, `"allowlist"`. OpenClaw
validates this strictly — an invalid value breaks the entire config on load.

### Dockerfile patching rules

OpenClaw ships pre-built dist files. The two existing patches are load-bearing
and must not be removed.

- Use **single-line** `sed` commands only. Multiline `python3 -c "..."` blocks
  fail — Docker treats each unescaped newline in a `RUN` as a new instruction.
- Use `sed` address + `{n; s/.../}` to match a line and substitute the next line.
- Glob patterns (`dist/session-accessor-*.js`) are fine; sed silently skips
  files where the pattern does not match.

Current patches:

| File glob                    | What                             | Why                                                |
| ---------------------------- | -------------------------------- | -------------------------------------------------- |
| `dist/secret-file-*.js`      | Skip FS permission check         | TigrisFS FUSE ignores chmod                        |
| `dist/session-accessor-*.js` | Deterministic JSON serialisation | Prevents "reply session initialization conflicted" |

**Do not patch dist files for Google Chat threading issues** — use the correct
config (`typingIndicator: "message"`, `replyToMode: "all"`) instead. The plugin
is well-tested and handles threading correctly with the right config.

### FUSE / TigrisFS

TigrisFS mounts R2 at `/r2` for backup. FUSE can deadlock, putting any process
touching `/r2` into uninterruptible D-state (blocking SSH and other operations).

To unmount a deadlocked FUSE mount:

```bash
umount -l /r2       # lazy unmount — detaches immediately even when deadlocked
killall -9 tigrisfs # kill driver so it can be restarted cleanly
```

Do **not** use `fusermount -u` on a deadlocked mount — it hangs indefinitely.

The `fuse_watchdog` loop in `entrypoint.sh` checks every 60 s with a 10 s
timeout and runs the above automatically on deadlock.

State lives on local disk (`/data`). R2 is backup only — a FUSE deadlock does
not lose data, it only blocks backup syncs until remount.

### SSH into the container

```bash
wrangler containers instances <APP_ID>   # get instance ID
wrangler containers ssh <INSTANCE_ID>
```

The SSH key is declared in `wrangler.jsonc` under `authorized_keys`. If SSH
fails with permission denied after a fresh deploy, wait for the container to
fully start and retry.
