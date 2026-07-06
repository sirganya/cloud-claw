FROM nikolaik/python-nodejs:python3.12-nodejs22-bookworm

ENV NODE_ENV=production
ENV PORT=6658

ARG TIGRISFS_VERSION=1.2.1
ARG GOGCLI_VERSION=0.31.1

RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends \
		fuse \
		ca-certificates \
		curl; \
	corepack enable pnpm; \
	if [ "$(uname -m)" = "x86_64" ]; then \
		curl -fsSL "https://github.com/tigrisdata/tigrisfs/releases/download/v${TIGRISFS_VERSION}/tigrisfs_${TIGRISFS_VERSION}_linux_amd64.deb" -o /tmp/tigrisfs.deb; \
		dpkg -i /tmp/tigrisfs.deb; \
		rm -f /tmp/tigrisfs.deb; \
	else \
		echo "tigrisfs not available for arm64"; \
	fi; \
	curl -fsSL "https://github.com/openclaw/gogcli/releases/download/v${GOGCLI_VERSION}/gogcli_${GOGCLI_VERSION}_linux_amd64.tar.gz" -o /tmp/gogcli.tar.gz; \
	tar -xzf /tmp/gogcli.tar.gz -C /usr/local/bin gog; \
	rm -f /tmp/gogcli.tar.gz; \
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
COPY openclaw-build/dist-runtime/ /openclaw/dist-runtime/

RUN printf '%s\n' '#!/usr/bin/env bash' 'exec node /openclaw/dist/index.js "$@"' > /usr/local/bin/openclaw \
	&& chmod +x /usr/local/bin/openclaw

RUN apt-get update && apt-get install -y --no-install-recommends rsync && rm -rf /var/lib/apt/lists/*

RUN install -m 755 /dev/stdin /entrypoint.sh <<'EOF'
#!/bin/bash
set -e

R2_MOUNT="/r2"
STATE_DIR="/data"

# State on LOCAL disk — fast, consistent reads/writes for sessions and SQLite
# R2 for durable backup only (credentials, workspace, agent history)
export OPENCLAW_STATE_DIR="$STATE_DIR"
export OPENCLAW_WORKSPACE_DIR="$STATE_DIR/workspace"
export OPENCLAW_SKIP_FS_PERMISSION_CHECK=1
export GOG_HOME="$STATE_DIR/gog"

mkdir -p "$STATE_DIR" "$STATE_DIR/workspace" "$STATE_DIR/gog"

mount_r2() {
	mountpoint -q "$R2_MOUNT" 2>/dev/null && fusermount -u "$R2_MOUNT" 2>/dev/null || true
	rm -rf "$R2_MOUNT"
	mkdir -p "$R2_MOUNT"

	if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_BUCKET" ] || [ -z "$S3_ACCESS_KEY_ID" ] || [ -z "$S3_SECRET_ACCESS_KEY" ]; then
		echo "[WARN] S3 not configured, no durable backup"
		return 1
	fi

	export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
	export AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
	export AWS_REGION="${S3_REGION:-auto}"
	export AWS_S3_PATH_STYLE="${S3_PATH_STYLE:-false}"

	/usr/bin/tigrisfs \
		--endpoint "$S3_ENDPOINT" \
		--memory-limit 2048 \
		--max-flushers 32 \
		--stat-cache-ttl 15m \
		${TIGRISFS_ARGS:-} \
		-f "${S3_BUCKET}${S3_PREFIX:+:$S3_PREFIX}" "$R2_MOUNT" &
	sleep 3

	if ! mountpoint -q "$R2_MOUNT"; then
		echo "[ERROR] R2 mount failed"
		return 1
	fi
	echo "[OK] R2 mounted at $R2_MOUNT"
	return 0
}

restore_from_r2() {
	echo "[INFO] Restoring state from R2..."
	for dir in credentials workspace agents gog; do
		if [ -d "$R2_MOUNT/$dir" ]; then
			mkdir -p "$STATE_DIR/$dir"
			rsync -a --exclude='openclaw.json' --exclude='openclaw.json.bak' "$R2_MOUNT/$dir/" "$STATE_DIR/$dir/" 2>/dev/null || true
			echo "[INFO] Restored $dir"
		fi
	done
}

backup_to_r2() {
	while true; do
		sleep 300
		if mountpoint -q "$R2_MOUNT" 2>/dev/null; then
			for dir in workspace credentials agents gog; do
				if [ -d "$STATE_DIR/$dir" ]; then
					rsync -a --delete "$STATE_DIR/$dir/" "$R2_MOUNT/$dir/" 2>/dev/null || true
				fi
			done
		fi
	done
}

fuse_watchdog() {
	while true; do
		sleep 60
		if [ "$R2_AVAILABLE" != "true" ]; then continue; fi
		# Test FUSE mount with a timeout — if stat hangs, the mount is dead
		if ! timeout 10 stat "$R2_MOUNT" >/dev/null 2>&1; then
			echo "[WARN] FUSE mount hung, remounting..."
			fusermount -u "$R2_MOUNT" 2>/dev/null || true
			sleep 2
			if mount_r2; then
				echo "[OK] FUSE remounted successfully"
			else
				echo "[ERROR] FUSE remount failed"
				R2_AVAILABLE=false
			fi
		fi
	done
}

R2_AVAILABLE=false
if mount_r2; then
	R2_AVAILABLE=true
	restore_from_r2
	backup_to_r2 &
	BACKUP_PID=$!
	fuse_watchdog &
fi

cleanup() {
	echo "[INFO] Shutting down..."
	# Final backup
	if [ "$R2_AVAILABLE" = "true" ] && mountpoint -q "$R2_MOUNT" 2>/dev/null; then
		echo "[INFO] Final backup to R2..."
		for dir in workspace credentials agents gog; do
			[ -d "$STATE_DIR/$dir" ] && rsync -a --delete "$STATE_DIR/$dir/" "$R2_MOUNT/$dir/" 2>/dev/null || true
		done
	fi
	[ -n "$BACKUP_PID" ] && kill "$BACKUP_PID" 2>/dev/null
	if [ -n "$OPENCLAW_PID" ]; then
		kill -TERM "$OPENCLAW_PID" 2>/dev/null
		wait "$OPENCLAW_PID" 2>/dev/null
	fi
	mountpoint -q "$R2_MOUNT" 2>/dev/null && fusermount -u "$R2_MOUNT" 2>/dev/null || true
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
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-3.5-flash"
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
    replyToMode: 'all',
    dm: { policy: 'open', enabled: true, allowFrom: ['*'] },
    groupPolicy: 'open',
    groupAllowFrom: ['*'],
    typingIndicator: 'message',
    groups: { 'spaces/AAQAdFhXWNQ': { enabled: true, requireMention: false } }
  };
  console.log('[INFO] Google Chat channel configured');
}

// Telegram (if bot token is available)
if (process.env.TELEGRAM_BOT_TOKEN) {
  c.channels.telegram = {
    enabled: true,
    name: 'Quickly',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    dmPolicy: 'open',
    groupPolicy: 'open',
    allowFrom: ['*'],
    groupAllowFrom: ['*']
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
    'memory-core': {
      enabled: true,
      config: {
        dreaming: {
          enabled: true,
          timezone: 'UTC',
        },
      },
    },
  },
};

// Session
c.session = { dmScope: 'per-channel-peer' };

fs.writeFileSync(f, JSON.stringify(c, null, 2));
"

echo "[INFO] Starting OpenClaw Gateway..."
echo "[INFO] Visit Web UI for initial setup on first use"
cd "$OPENCLAW_WORKSPACE_DIR"

openclaw gateway --port 6658 --bind lan --allow-unconfigured &
OPENCLAW_PID=$!
wait $OPENCLAW_PID
EOF

LABEL cloud-claw.version="v2-no-operator-ws"

WORKDIR /data/workspace
EXPOSE 6658

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
	CMD curl -f http://localhost:6658/health && timeout 5 stat /data >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
