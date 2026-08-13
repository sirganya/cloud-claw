FROM nikolaik/python-nodejs:python3.12-nodejs22-bookworm

ENV NODE_ENV=production
ENV PORT=6658

ARG RCLONE_VERSION=1.68.2
ARG GOGCLI_VERSION=0.31.1
ARG GH_VERSION=2.96.0

# rclone replaces the tigrisfs FUSE mount: R2 sync happens over plain S3 API
# calls, so a network stall is a timeout instead of a D-state kernel hang.
# sqlite3 is needed for atomic .backup snapshots of live databases.
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends \
		ca-certificates \
		curl \
		sqlite3; \
	corepack enable pnpm; \
	ARCH="$(dpkg --print-architecture)"; \
	curl -fsSL "https://downloads.rclone.org/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-${ARCH}.deb" -o /tmp/rclone.deb; \
	dpkg -i /tmp/rclone.deb; \
	rm -f /tmp/rclone.deb; \
	curl -fsSL "https://github.com/openclaw/gogcli/releases/download/v${GOGCLI_VERSION}/gogcli_${GOGCLI_VERSION}_linux_amd64.tar.gz" -o /tmp/gogcli.tar.gz; \
	tar -xzf /tmp/gogcli.tar.gz -C /usr/local/bin gog; \
	rm -f /tmp/gogcli.tar.gz; \
	curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${ARCH}.tar.gz" -o /tmp/gh.tar.gz; \
	tar -xzf /tmp/gh.tar.gz -C /usr/local/bin --strip-components=2 "gh_${GH_VERSION}_linux_${ARCH}/bin/gh"; \
	rm -f /tmp/gh.tar.gz; \
	rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# node_modules split into layers by size (~2.3GB total)
# Layer 1: largest scoped packages (~650MB)
COPY openclaw-build/node_modules/@github /openclaw/node_modules/@github
COPY openclaw-build/node_modules/@anthropic-ai /openclaw/node_modules/@anthropic-ai
# Layer 2: AI/ML packages (~520MB)
COPY openclaw-build/node_modules/@openai /openclaw/node_modules/@openai
COPY openclaw-build/node_modules/@zed-industries /openclaw/node_modules/@zed-industries
COPY openclaw-build/node_modules/openclaw /openclaw/node_modules/openclaw
COPY openclaw-build/node_modules/@lancedb /openclaw/node_modules/@lancedb
# Layer 3: remaining scoped packages
COPY openclaw-build/node_modules/@tloncorp /openclaw/node_modules/@tloncorp
COPY openclaw-build/node_modules/@opentelemetry /openclaw/node_modules/@opentelemetry
COPY openclaw-build/node_modules/@azure /openclaw/node_modules/@azure
COPY openclaw-build/node_modules/@typescript /openclaw/node_modules/@typescript
COPY openclaw-build/node_modules/@larksuiteoapi /openclaw/node_modules/@larksuiteoapi
COPY openclaw-build/node_modules/@slack /openclaw/node_modules/@slack
COPY openclaw-build/node_modules/@mistralai /openclaw/node_modules/@mistralai
COPY openclaw-build/node_modules/@pierre /openclaw/node_modules/@pierre
# Layer 4: everything else
COPY openclaw-build/node_modules /openclaw/node_modules

# Config and package files
COPY openclaw-build/extensions /openclaw/extensions
COPY openclaw-build/package.json /openclaw/package.json
COPY openclaw-build/pnpm-workspace.yaml /openclaw/pnpm-workspace.yaml
COPY openclaw-build/openclaw.mjs /openclaw/openclaw.mjs
COPY openclaw-build/packages /openclaw/packages

# Pre-built dist artifacts (overlay last so they win)
COPY openclaw-build/dist/ /openclaw/dist/

# Workspace templates
COPY openclaw-build/docs/reference/templates/ /openclaw/src/agents/templates/

# Patch: skip secret-dir permission check on FUSE mounts (TigrisFS ignores chmod)
RUN sed -i 's/if (process.platform === "win32") return;/if (process.platform === "win32" || process.env.OPENCLAW_SKIP_FS_PERMISSION_CHECK === "1") return;/' /openclaw/dist/secret-file-*.js

# Patch: deterministic session revision to fix "reply session initialization conflicted" (#key-ordering)
RUN sed -i 's/function createReplySessionInitializationRevision(entry) {/function _canonicalize(v){if(v===null||typeof v!=="object")return v;if(Array.isArray(v))return v.map(_canonicalize);var r={};Object.keys(v).sort().forEach(function(k){if(v[k]!==undefined)r[k]=_canonicalize(v[k])});return r}function createReplySessionInitializationRevision(entry) {/' /openclaw/dist/session-accessor-*.js
RUN sed -i 's/return JSON.stringify(entry ?? null);/return JSON.stringify(_canonicalize(entry ?? null));/' /openclaw/dist/session-accessor-*.js

# Patch: also accept the bridge's own SA OIDC token for local webhook auth (#bridge-auth)
# The chat-bridge signs with the app's SA, not chat@system.gserviceaccount.com.
# Pinned to the exact SA email (CHAT_BRIDGE_SA_EMAIL, exported by the entrypoint) —
# a suffix match on *.iam.gserviceaccount.com would let ANY GCP service account
# mint a valid token for our audience URL and inject messages.
RUN sed -i 's/if (email === CHAT_ISSUER) return { ok: true };/if (email === CHAT_ISSUER || (process.env.CHAT_BRIDGE_SA_EMAIL \&\& email === process.env.CHAT_BRIDGE_SA_EMAIL.toLowerCase())) return { ok: true };/' /openclaw/dist/targets-*.js

COPY openclaw-build/dist-runtime/ /openclaw/dist-runtime/

RUN printf '%s\n' '#!/usr/bin/env bash' 'exec node /openclaw/dist/index.js "$@"' > /usr/local/bin/openclaw \
	&& chmod +x /usr/local/bin/openclaw

# Chat bridge: polls Google Chat REST API for space messages and forwards to OpenClaw webhook.
# Avoids Pub/Sub/Workspace Events setup — uses the app's own service account credentials.
RUN install -m 755 /dev/stdin /usr/local/lib/chat-bridge.mjs <<'EOF'
#!/usr/bin/env node
// Polls Google Chat REST API for new space messages and forwards them to the
// OpenClaw webhook as synthetic MESSAGE events, so the bot can respond to all
// space messages (Google only sends webhook events when the app is @mentioned).
//
// Auth model (see AGENTS.md → Chat bridge):
// - messages.list rejects the app scope (chat.bot); it requires user auth.
//   We use domain-wide delegation: the SA impersonates
//   GOOGLE_CHAT_IMPERSONATE_USER (a space member) with chat.messages.readonly.
// - spaces.get accepts app auth (chat.bot) — used once to resolve spaceType.
// - Forwarding authenticates with a Google-signed SA OIDC token
//   (audience = WORKER_URL/googlechat); the patched verifier (#bridge-auth)
//   accepts exactly this SA via CHAT_BRIDGE_SA_EMAIL.
import { readFileSync } from 'fs'
import { createSign } from 'crypto'

const SPACES = (process.env.GOOGLE_CHAT_SPACE || '')       // comma-separated, e.g. spaces/AAQAdFhXWNQ,spaces/AAQAkEQWJXA
  .split(',').map(s => s.trim()).filter(Boolean)
const IMPERSONATE = process.env.GOOGLE_CHAT_IMPERSONATE_USER  // space member to read as (must be a member of every space above)
const WORKER_URL = process.env.WORKER_URL
const PORT = process.env.PORT || 6658
const STATE_DIR = process.env.OPENCLAW_STATE_DIR || '/data'
const SA_PATH = `${STATE_DIR}/googlechat-sa.json`
const WEBHOOK_AUDIENCE = `${WORKER_URL}/googlechat`
const LOCAL_WEBHOOK = `http://localhost:${PORT}/googlechat`
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const POLL_MS = 5_000

if (SPACES.length === 0 || !WORKER_URL || !IMPERSONATE) {
  console.log('[chat-bridge] GOOGLE_CHAT_SPACE, GOOGLE_CHAT_IMPERSONATE_USER or WORKER_URL not set — exiting')
  process.exit(0)
}

let sa
try {
  sa = JSON.parse(readFileSync(SA_PATH, 'utf8'))
} catch {
  console.log('[chat-bridge] No service account at', SA_PATH, '— exiting')
  process.exit(0)
}

// Bot identity for mention filtering — same source OpenClaw uses (channels.googlechat.botUser)
let botUser = null
try {
  botUser = JSON.parse(readFileSync(`${STATE_DIR}/openclaw.json`, 'utf8')).channels?.googlechat?.botUser ?? null
} catch {}

// Cloudflare log ingestion splits stdout per line — Google API error bodies are
// pretty-printed multi-line JSON, so collapse them or one error becomes N garbage
// log records ("message": "{").
const oneLine = s => String(s).replace(/\s*\n\s*/g, ' ')

function signJwt(claims) {
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url')
  const hdr = enc({ alg: 'RS256', typ: 'JWT' })
  const pld = enc(claims)
  const s = createSign('RSA-SHA256')
  s.update(`${hdr}.${pld}`)
  return `${hdr}.${pld}.${s.sign(sa.private_key, 'base64url')}`
}

async function googleToken(extra, wantIdToken = false) {
  const now = Math.floor(Date.now() / 1_000)
  const assertion = signJwt({
    iss: sa.client_email,
    aud: TOKEN_URL,
    iat: now, exp: now + 3_600, ...extra,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  const d = await res.json()
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(d)}`)
  return wantIdToken ? d.id_token : d.access_token
}

const cache = {}
async function cachedToken(kind, mint) {
  const now = Math.floor(Date.now() / 1_000)
  const hit = cache[kind]
  if (hit && hit.exp > now + 60) return hit.token
  const token = await mint()
  cache[kind] = { token, exp: now + 3_500 }
  return token
}

// User token via domain-wide delegation — the only auth messages.list accepts here
const userToken = () => cachedToken('user', () =>
  googleToken({ sub: IMPERSONATE, scope: 'https://www.googleapis.com/auth/chat.messages.readonly' }))
// App token (chat.bot) — valid for spaces.get, NOT for messages.list
const appToken = () => cachedToken('app', () =>
  googleToken({ scope: 'https://www.googleapis.com/auth/chat.bot' }))
// Google-signed SA OIDC token for authenticating to the local webhook
const oidcToken = () => cachedToken('oidc', () =>
  googleToken({ target_audience: WEBHOOK_AUDIENCE }, true))

async function waitForGateway() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/health`)
      if (r.ok) return
    } catch {}
    await new Promise(r => setTimeout(r, 2_000))
  }
  console.error('[chat-bridge] Gateway not ready after 2 min — exiting')
  process.exit(1)
}

// Per-space state: resolved space object (with spaceType, for OpenClaw's group
// detection) and the polling cursor. Keyed by space resource name so multiple
// spaces poll independently — one space's failure never affects another's.
const spaceState = new Map(SPACES.map(name => [name, {
  space: { name, spaceType: 'SPACE' },
  lastCreateTime: new Date().toISOString(),
}]))

// Full space object (with spaceType) so OpenClaw's group detection doesn't rely
// on fallbacks — messages.list results don't carry spaceType.
async function resolveSpace(name) {
  const st = spaceState.get(name)
  try {
    const t = await appToken()
    const r = await fetch(`https://chat.googleapis.com/v1/${name}`, { headers: { Authorization: `Bearer ${t}` } })
    if (r.ok) {
      st.space = await r.json()
      return
    }
    console.error('[chat-bridge]', name, 'spaces.get failed', r.status, oneLine(await r.text().catch(() => '')))
  } catch (e) {
    console.error('[chat-bridge]', name, 'spaces.get error:', e.message)
  }
  console.error('[chat-bridge]', name, 'Using fallback space object (spaceType=SPACE)')
}

// Wake-up notice: the bridge starts once per container boot, so this fires on
// every cold start. Cold starts are slow (R2 restore + gateway load + agent
// boot) — post a short note so the user isn't staring at "is typing" silence.
// Skipped during automated wakes (nobody is waiting on a reply) and when the
// gateway is already healthy (bridge-only restart).
function inQuietWakeWindow() {
  const now = new Date()
  const h = now.getUTCHours(), m = now.getUTCMinutes()
  // Nightly dream wake (Worker cron 02:50 UTC; dreaming runs until ~04:35)
  if ((h === 2 && m >= 45) || h === 3 || (h === 4 && m <= 35)) return true
  // Status-report wakes: Worker cron fires at 07:55/08:55/13:55/14:55 UTC so
  // the 09:00/15:00 Europe/Dublin jobs can run across DST. A boot within a few
  // minutes of those wakes is automated; user-triggered boots outside these
  // narrow windows still get the notice.
  if (m >= 50 && [7, 8, 13, 14].includes(h)) return true
  if (m <= 10 && [8, 9, 14, 15].includes(h)) return true
  return false
}

async function announceWake() {
  if (inQuietWakeWindow()) return
  try {
    const r = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(1_000) })
    if (r.ok) return // gateway already up — not a cold start
  } catch {}
  for (const name of SPACES) {
    try {
      const t = await appToken()
      const r = await fetch(`https://chat.googleapis.com/v1/${name}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '_Waking up — loading memory, back with you shortly..._' }),
      })
      if (!r.ok) console.error('[chat-bridge]', name, 'Wake notice failed', r.status, oneLine(await r.text().catch(() => '')))
      else console.log('[chat-bridge]', name, 'Wake notice posted')
    } catch (e) {
      console.error('[chat-bridge]', name, 'Wake notice error:', e.message)
    }
  }
}

// Only skip messages that @mention the BOT — those arrive via the direct
// Google webhook and would be processed twice. Mentions of other users must
// still be forwarded.
function mentionsBot(msg) {
  const targets = new Set(['users/app', botUser].filter(Boolean))
  return (msg.annotations ?? [])
    .some(a => a.type === 'USER_MENTION' && targets.has(a.userMention?.user?.name))
}

// Exact createTime of the newest processed message per space. The server-side
// filter is strictly greater-than, so we pass back Google's own full-precision
// timestamp instead of comparing strings locally (mixed fractional precision
// breaks lexicographic order). Cursor lives in spaceState (per-space).

async function fetchNewMessages(token, name, lastCreateTime) {
  const out = []
  let pageToken
  do {
    const qs = new URLSearchParams({
      filter: `createTime > "${lastCreateTime}"`,
      orderBy: 'createTime ASC',
      pageSize: '100',
    })
    if (pageToken) qs.set('pageToken', pageToken)
    const r = await fetch(`https://chat.googleapis.com/v1/${name}/messages?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) {
      const body = oneLine(await r.text().catch(() => ''))
      if (r.status === 403) {
        console.error(
          '[chat-bridge]', name, '403 from messages.list — check domain-wide delegation:',
          `authorize client ID ${sa.client_id} for scope chat.messages.readonly in the Admin console,`,
          `and ensure ${IMPERSONATE} is a member of ${name}.`, body,
        )
      } else {
        console.error('[chat-bridge]', name, 'Chat API error', r.status, body)
      }
      return out
    }
    const data = await r.json()
    out.push(...(data.messages ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return out
}

async function forward(msg, space) {
  // Reply threading: OpenClaw replies into message.thread.name
  // (extensions/googlechat/src/monitor.ts → replyToId → outbound thread).
  // threadReply is false for top-level messages, so stripping thread there
  // makes the reply post top-level; in-thread messages keep their thread.
  const message = msg.threadReply ? msg : { ...msg, thread: undefined }
  const evt = {
    type: 'MESSAGE',
    eventTime: msg.createTime,
    space,
    message,
    user: msg.sender,
  }
  const ot = await oidcToken()
  const fw = await fetch(LOCAL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ot}` },
    body: JSON.stringify(evt),
  })
  if (!fw.ok) {
    console.error('[chat-bridge] Forward failed', fw.status, oneLine(await fw.text().catch(() => '')))
  } else {
    console.log('[chat-bridge] Forwarded message from', msg.sender?.displayName ?? msg.sender?.name ?? 'unknown')
  }
}

async function pollOnce() {
  const token = await userToken()
  for (const name of SPACES) {
    const st = spaceState.get(name)
    try {
      const msgs = await fetchNewMessages(token, name, st.lastCreateTime) // createTime ASC
      for (const msg of msgs) {
        const fromBot = msg.sender?.type === 'BOT' || msg.sender?.name === 'users/app'
        if (fromBot || mentionsBot(msg)) continue
        try {
          await forward(msg, st.space)
        } catch (e) {
          console.error('[chat-bridge]', name, 'Error:', e.message)
        }
      }
      if (msgs.length > 0) st.lastCreateTime = msgs[msgs.length - 1].createTime
    } catch (e) {
      console.error('[chat-bridge]', name, 'Poll error:', e.message)
    }
  }
}

await announceWake()
console.log('[chat-bridge] Waiting for gateway...')
await waitForGateway()
await Promise.all(SPACES.map(resolveSpace))
console.log('[chat-bridge] Ready — polling', SPACES.join(', '), 'as', IMPERSONATE)
const tick = () => pollOnce().catch(e => console.error('[chat-bridge] Poll error:', e.message))
await tick()
setInterval(tick, POLL_MS)
EOF

RUN install -m 755 /dev/stdin /entrypoint.sh <<'EOF'
#!/bin/bash
set -e

STATE_DIR="/data"

# State on LOCAL disk — fast, consistent reads/writes for sessions and SQLite.
# R2 is durable backup only, accessed via rclone S3 API calls (no FUSE mount:
# a network stall is a timeout, not a D-state hang that wedges the container).
export OPENCLAW_STATE_DIR="$STATE_DIR"
export OPENCLAW_WORKSPACE_DIR="$STATE_DIR/workspace"
export OPENCLAW_SKIP_FS_PERMISSION_CHECK=1
export GOG_HOME="$STATE_DIR/gog"

mkdir -p "$STATE_DIR" "$STATE_DIR/workspace" "$STATE_DIR/gog"

BACKUP_DIRS="workspace credentials agents gog"
# Live SQLite files must never be copied raw (torn mid-write copies) and WAL/SHM
# sidecars from a different DB generation corrupt the DB on open. Consistent
# copies travel via sqlite-snapshots/ (see backup_sqlite_snapshots).
WAL_EXCLUDES=(--exclude '*.sqlite-wal' --exclude '*.sqlite-shm' --exclude '*.sqlite-journal')
SQLITE_EXCLUDES=("${WAL_EXCLUDES[@]}" --exclude '*.sqlite')

# S3 credentials live in unexported RCLONE_S3_* shell vars (set at startup,
# scrubbed from the environment before the gateway starts) and are passed
# per-invocation so no child process inherits them.
run_rclone() {
	RCLONE_CONFIG_R2_TYPE=s3 \
	RCLONE_CONFIG_R2_PROVIDER=Other \
	RCLONE_CONFIG_R2_ENDPOINT="$RCLONE_S3_ENDPOINT" \
	RCLONE_CONFIG_R2_ACCESS_KEY_ID="$RCLONE_S3_KEY" \
	RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$RCLONE_S3_SECRET" \
	RCLONE_CONFIG_R2_REGION="$RCLONE_S3_REGION" \
	RCLONE_CONFIG_R2_FORCE_PATH_STYLE="$RCLONE_S3_PATH_STYLE" \
	rclone --config /dev/null --timeout 60s --contimeout 15s --retries 2 --log-level ERROR "$@"
}

# Atomic snapshots of live SQLite DBs via sqlite3 .backup, staged locally and
# uploaded with copy (not sync): a partially built staging tree must never
# delete older good snapshots on the remote.
backup_sqlite_snapshots() {
	local staging=/tmp/sqlite-snapshots dir db rel
	rm -rf "$staging"
	for dir in $BACKUP_DIRS; do
		[ -d "$STATE_DIR/$dir" ] || continue
		while IFS= read -r -d '' db; do
			rel="${db#"$STATE_DIR"/}"
			mkdir -p "$staging/$(dirname "$rel")"
			sqlite3 "$db" ".backup '$staging/$rel'" 2>/dev/null || true
		done < <(find "$STATE_DIR/$dir" -name '*.sqlite' -type f -print0)
	done
	if [ -d "$staging" ]; then
		run_rclone copy "$staging" "$REMOTE/sqlite-snapshots" || true
	fi
	rm -rf "$staging"
}

restore_from_r2() {
	echo "[INFO] Restoring state from R2..."
	local failed=0 dir
	# Legacy migration: before sqlite-snapshots/ exists on the remote (first
	# boot after the rclone switch), restore the rsync-era raw .sqlite files —
	# losing all agent history is worse than a possibly-torn copy.
	local have_snapshots=1
	run_rclone lsf --max-depth 1 "$REMOTE/sqlite-snapshots" >/dev/null 2>&1 || have_snapshots=0
	local -a excludes=("${WAL_EXCLUDES[@]}")
	if [ "$have_snapshots" -eq 1 ]; then
		excludes=("${SQLITE_EXCLUDES[@]}")
	fi
	for dir in $BACKUP_DIRS; do
		# Absent remote dir (fresh bucket) is fine — not a restore failure
		if ! run_rclone lsf --max-depth 1 "$REMOTE/$dir" >/dev/null 2>&1; then
			echo "[INFO] No remote $dir to restore"
			continue
		fi
		mkdir -p "$STATE_DIR/$dir"
		if run_rclone copy "${excludes[@]}" --exclude 'openclaw.json' --exclude 'openclaw.json.bak' "$REMOTE/$dir" "$STATE_DIR/$dir"; then
			echo "[INFO] Restored $dir"
		else
			echo "[WARN] Restore of $dir failed"
			failed=1
		fi
	done
	if [ "$have_snapshots" -eq 1 ]; then
		run_rclone copy "$REMOTE/sqlite-snapshots" "$STATE_DIR" || failed=1
	fi
	if [ "$failed" -eq 0 ]; then
		RESTORE_OK=true
	else
		echo "[WARN] Restore incomplete — backups run copy-only (no remote deletes)"
	fi
}

do_backup() {
	local dir
	for dir in $BACKUP_DIRS; do
		[ -d "$STATE_DIR/$dir" ] || continue
		if [ "$RESTORE_OK" = "true" ]; then
			# sync (remote deletes) is only safe after a proven-good restore;
			# otherwise an empty/partial local dir would wipe the R2 backup
			run_rclone sync "${SQLITE_EXCLUDES[@]}" "$STATE_DIR/$dir" "$REMOTE/$dir" || true
		else
			run_rclone copy "${SQLITE_EXCLUDES[@]}" "$STATE_DIR/$dir" "$REMOTE/$dir" || true
		fi
	done
	backup_sqlite_snapshots
}

backup_to_r2() {
	while true; do
		sleep 300
		do_backup
	done
}

R2_AVAILABLE=false
RESTORE_OK=false
BACKUP_PID=""
if [ -n "$S3_ENDPOINT" ] && [ -n "$S3_BUCKET" ] && [ -n "$S3_ACCESS_KEY_ID" ] && [ -n "$S3_SECRET_ACCESS_KEY" ]; then
	# Keep S3 credentials out of the gateway/bridge environment — the agent
	# runs as root under the gateway and must not casually inherit storage
	# credentials or storage plumbing (it previously wiped/hung on /r2).
	# Root can still read /proc/1/environ; this closes the accidental path.
	RCLONE_S3_ENDPOINT="$S3_ENDPOINT"
	RCLONE_S3_KEY="$S3_ACCESS_KEY_ID"
	RCLONE_S3_SECRET="$S3_SECRET_ACCESS_KEY"
	RCLONE_S3_REGION="${S3_REGION:-auto}"
	RCLONE_S3_PATH_STYLE="${S3_PATH_STYLE:-false}"
	RCLONE_S3_BUCKET="$S3_BUCKET"
	REMOTE="r2:${S3_BUCKET}${S3_PREFIX:+/$S3_PREFIX}"
	unset S3_ENDPOINT S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_REGION S3_PATH_STYLE S3_PREFIX AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION AWS_S3_PATH_STYLE

	if run_rclone lsd "r2:$RCLONE_S3_BUCKET" >/dev/null 2>&1; then
		R2_AVAILABLE=true
		restore_from_r2
		backup_to_r2 &
		BACKUP_PID=$!
	else
		echo "[WARN] R2 bucket unreachable — no restore, no durable backup"
	fi
else
	echo "[WARN] S3 not configured, no durable backup"
fi

cleanup() {
	echo "[INFO] Shutting down..."
	[ -n "$BACKUP_PID" ] && kill "$BACKUP_PID" 2>/dev/null || true
	[ -n "$CHAT_BRIDGE_PID" ] && kill "$CHAT_BRIDGE_PID" 2>/dev/null || true
	# Stop the gateway first so SQLite quiesces before the final snapshot
	if [ -n "$OPENCLAW_PID" ]; then
		kill -TERM "$OPENCLAW_PID" 2>/dev/null || true
		wait "$OPENCLAW_PID" 2>/dev/null || true
	fi
	if [ "$R2_AVAILABLE" = "true" ]; then
		echo "[INFO] Final backup to R2..."
		do_backup
	fi
	exit 0
}
trap cleanup SIGTERM SIGINT

if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
	echo "[INFO] Using Gateway Token from environment variable"
else
	echo "[WARN] OPENCLAW_GATEWAY_TOKEN not set, will be auto-generated"
fi

# Google Chat setup: install plugin, write service account, patch config
if [ -n "$GOOGLE_CHAT_SERVICE_ACCOUNT" ]; then
	echo "$GOOGLE_CHAT_SERVICE_ACCOUNT" > "$STATE_DIR/googlechat-sa.json"
	echo "[INFO] Google Chat service account written"
fi

# Always write config (overwrite stale R2-persisted config from previous deploys)
cat > "$OPENCLAW_STATE_DIR/openclaw.json" << EOFCONFIG
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 6658,
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    },
    "trustedProxies": ["10.0.0.0/8"],
    "controlUi": {
      "allowInsecureAuth": true,
      "allowedOrigins": ["${WORKER_URL}"],
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "dangerouslyDisableDeviceAuth": true
    }
  },
  "commands": {
    "ownerAllowFrom": ["googlechat:users/109178430018179297743", "telegram:8667624550"]
  },
  "cron": {
    "enabled": false
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-3.5-flash"
      },
      "contextTokens": 65536,
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "5m"
      },
      "compaction": {
        "midTurnPrecheck": { "enabled": true },
        "maxActiveTranscriptBytes": 524288,
        "truncateAfterCompaction": true
      },
      "memorySearch": {
        "enabled": true,
        "provider": "gemini"
      }
    }
  },
  "browser": {
    "enabled": true,
    "evaluateEnabled": true,
    "remoteCdpTimeoutMs": 120000,
    "remoteCdpHandshakeTimeoutMs": 60000,
    "attachOnly": true,
    "defaultProfile": "cloudflare",
    "profiles": {
      "cloudflare": {
        "cdpUrl": "${WORKER_URL}/cloudflare.browser/${OPENCLAW_GATEWAY_TOKEN}",
        "driver": "clawd",
        "color": "#FF4500"
      }
    }
  }
}
EOFCONFIG
echo "[INFO] Config written to $OPENCLAW_STATE_DIR/openclaw.json"

# Seed MEMORY.md with operational context — only if it doesn't already exist
if [ ! -f "$OPENCLAW_WORKSPACE_DIR/MEMORY.md" ]; then
cat > "$OPENCLAW_WORKSPACE_DIR/MEMORY.md" << 'EOFMEMORY'
# System Memory

## Config file: /data/openclaw.json — BE VERY CAREFUL

On 2026-06-29 and 2026-06-30 the gateway crashed multiple times because the AI modified openclaw.json incorrectly:

1. **Gateway token changed** — the token in `gateway.auth.token` must match the Worker proxy. Changing it breaks all auth and locks you out.
2. **Invalid channel config added** — adding `channels.googlechat` with an invalid `groupPolicy` value caused OpenClaw config validation to reject the entire file. This broke dreaming, memory-core, and all plugins.
3. **Invalid JSON written** — malformed JSON crashed the gateway entirely.

Each time required the operator to redeploy the container to recover.

**Rules when editing openclaw.json:**
- NEVER change `gateway.auth.token` — it must match the Worker
- NEVER add channel configs with unknown or invalid property values — OpenClaw has strict validation. Valid channel policy values are: "open", "disabled", "allowlist"
- Always validate your JSON is well-formed before writing
- Keep a mental note of what the working config looked like before changing it
- If unsure about a config property, don't add it — ask the operator

## Channels

- **Google Chat** is configured in the entrypoint config. The channel config at `channels.googlechat` is managed by the operator. Do not modify `audienceType`, `audience`, `webhookPath`, `serviceAccountFile`, or `dm.policy`. You may add users to `dm.allowFrom` or configure spaces under `groups` — but use only valid values: groupPolicy must be "open", "disabled", or "allowlist".

## Environment

- Cloudflare Container behind a Worker proxy on port 6658
- Browser automation via Cloudflare Browser Rendering CDP proxy
- Embedding/memory provider is `gemini` — there is no OpenAI API key
- State backed up to R2 periodically (workspace, credentials, agents dirs)
- Container may be recycled — the entrypoint rewrites openclaw.json on every boot from a template, so runtime config changes are lost on restart
EOFMEMORY
echo "[INFO] MEMORY.md seeded in workspace"
fi

# Progress-updates instruction: appended once (marker-guarded) to the restored
# workspace AGENTS.md. Google Chat has no live status edits like Telegram, so
# the agent itself must narrate long tasks.
if ! grep -q 'cloud-claw:progress-updates' "$OPENCLAW_WORKSPACE_DIR/AGENTS.md" 2>/dev/null; then
cat >> "$OPENCLAW_WORKSPACE_DIR/AGENTS.md" << 'EOFPROGRESS'

<!-- cloud-claw:progress-updates -->
## Progress updates (operator instruction)

Google Chat cannot show your working status, so narrate it yourself. For any
task likely to take more than ~20 seconds (multiple tool calls, browsing,
searches, file work):

- Post a one-line message when you start, e.g. "On it — searching the docs...".
- Post a short update after each significant step, roughly every 30 seconds of
  work, e.g. "Found 3 candidates, checking each...".
- Keep updates to a single short line. Never repeat a previous update.
- Then send the actual answer as a normal final message.

Do not do this for quick replies — only when real work is happening.
EOFPROGRESS
echo "[INFO] Progress-updates instruction appended to workspace AGENTS.md"
fi

# Lead-scout workspace seeding and the AGENTS.md lead-feedback instruction
# were removed 2026-08-02 along with the lead-scout cron (Gemini cost cleanup).
# The stale <!-- cloud-claw:lead-feedback --> block is stripped from the
# R2-persisted AGENTS.md here so it stops inflating every run's context.
if grep -q 'cloud-claw:lead-feedback' "$OPENCLAW_WORKSPACE_DIR/AGENTS.md" 2>/dev/null; then
	sed -i '/<!-- cloud-claw:lead-feedback -->/,/^- Acknowledge briefly in chat; no long summaries\.$/d' "$OPENCLAW_WORKSPACE_DIR/AGENTS.md"
	echo "[INFO] Stale lead-feedback instruction stripped from workspace AGENTS.md"
fi

# Patch config with channels, plugins, and session settings
node -e "
const fs = require('fs');
const f = '$OPENCLAW_STATE_DIR/openclaw.json';
const c = JSON.parse(fs.readFileSync(f, 'utf8'));

c.channels = c.channels || {};

// Google Chat (if service account is available)
if (fs.existsSync('$STATE_DIR/googlechat-sa.json')) {
  c.channels.googlechat = {
    enabled: true,
    name: 'Quickly',
    serviceAccountFile: '$STATE_DIR/googlechat-sa.json',
    audienceType: 'app-url',
    audience: '${WORKER_URL}/googlechat',
    webhookPath: '/googlechat',
    appPrincipal: '103119841339856136234',
    botUser: 'users/103119841339856136234',
    dm: { policy: 'open', enabled: true, allowFrom: ['*'] },
    groupPolicy: 'open',
    groupAllowFrom: ['*'],
    replyToMode: 'all',
    groups: {
      'spaces/AAQAdFhXWNQ': { enabled: true, requireMention: false },
      'spaces/AAQAkEQWJXA': { enabled: true, requireMention: false }
    }
  };
  console.log('[INFO] Google Chat channel configured');
}

// Telegram (if bot token is available)
if (process.env.TELEGRAM_BOT_TOKEN) {
  // Locked to Greg's Telegram user id (doctor flagged open DM/group policy)
  c.channels.telegram = {
    enabled: true,
    name: 'Quickly',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    dmPolicy: 'allowlist',
    groupPolicy: 'allowlist',
    allowFrom: ['8667624550'],
    groupAllowFrom: ['8667624550']
  };
  console.log('[INFO] Telegram channel configured');
}

// Plugins
c.plugins = {
  entries: {
    google: { enabled: true },
    browser: { enabled: true },
    googlechat: { enabled: true },
    telegram: { enabled: true },
    duckduckgo: { enabled: true },
    'memory-core': {
      enabled: true,
      config: {
        dreaming: {
          enabled: false,
          timezone: 'UTC',
        },
      },
    },
  },
};

// Web search for the daily lead scout (DuckDuckGo: free, no API key needed)
c.tools = c.tools || {};
c.tools.web = c.tools.web || {};
c.tools.web.search = { enabled: true, provider: 'duckduckgo' };

// Session
c.session = { dmScope: 'per-channel-peer' };

fs.writeFileSync(f, JSON.stringify(c, null, 2));
"

# GitHub skill (@steipete/github wraps the gh CLI, installed in the image).
# Lands in the workspace skills dir (R2-backed), so this only runs on first
# boot after the dir is gone. Standalone install — no gateway needed — and it
# must run BEFORE gateway start because skills are loaded once at startup.
# Non-fatal: a ClawHub outage must not block boot. Auth: gh reads GH_TOKEN
# (fine-grained PAT scoped to the allowed private repo) from the environment;
# no gh auth login required.
if [ ! -d "$OPENCLAW_WORKSPACE_DIR/skills/github" ]; then
	if openclaw skills install @steipete/github --acknowledge-clawhub-risk; then
		echo "[INFO] Skill installed: @steipete/github"
	else
		echo "[WARN] Skill install failed: @steipete/github (will retry next boot)"
	fi
fi

echo "[INFO] Starting OpenClaw Gateway..."
echo "[INFO] Visit Web UI for initial setup on first use"
cd "$OPENCLAW_WORKSPACE_DIR"

# Exact SA email the patched webhook verifier accepts for bridge tokens (#bridge-auth)
if [ -f "$STATE_DIR/googlechat-sa.json" ]; then
	export CHAT_BRIDGE_SA_EMAIL=$(node -p "JSON.parse(require('fs').readFileSync('$STATE_DIR/googlechat-sa.json','utf8')).client_email")
	echo "[INFO] Bridge SA email pinned: $CHAT_BRIDGE_SA_EMAIL"
fi

openclaw gateway --port 6658 --bind lan --allow-unconfigured &
OPENCLAW_PID=$!

if [ -n "$GOOGLE_CHAT_SPACE" ]; then
	node /usr/local/lib/chat-bridge.mjs &
	CHAT_BRIDGE_PID=$!
	echo "[INFO] Chat bridge started (PID $CHAT_BRIDGE_PID), polling $GOOGLE_CHAT_SPACE"
fi

# Status reports and daily standup were removed 2026-07-29 (unwanted chat
# noise) and are NOT recreated here; the standup is now run on demand by
# asking the agent, using its project-manager skill. memory-core's
# dreaming.enabled flag (see plugins config above) is off so it no longer
# self-heals its own "Memory Dreaming Promotion" job. Do not reintroduce
# automatic cron creation for those without explicit confirmation.
#
#
# lead-scout was disabled 2026-08-02 (Gemini cost cleanup): the creation
# block was removed and cron.enabled=false is set in the config template.
# The old job row may persist in state/openclaw.sqlite but never runs.
# Do not reintroduce it without explicit confirmation.

wait $OPENCLAW_PID
EOF

LABEL cloud-claw.version="v3-rclone-operator-ws"

WORKDIR /data/workspace
EXPOSE 6658

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
	CMD curl -f http://localhost:6658/health && timeout 5 stat /data >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
