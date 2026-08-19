import { Container, switchPort } from '@cloudflare/containers'
import { env } from 'cloudflare:workers'

const PORT = 6658

// Gateway events that represent real work in progress. Renewing on these keeps
// the container alive during long agent runs and bridge-forwarded chats that
// never touch the Worker. Heartbeat noise (tick, pong, node.presence.alive,
// notifications.changed) must NOT renew or the container never sleeps.
const ACTIVITY_EVENTS = new Set(['chat', 'agent.request', 'exec.started', 'exec.finished', 'tool'])

const HEALTH_CHECK_INTERVAL_MS = 5 * 60_000
const HEALTH_CHECK_TIMEOUT_MS = 15_000
const MAX_HEALTH_FAILURES = 3
const WS_RECONNECT_DELAY_MS = 30_000

const containerEnv = Object.fromEntries(
  Object.entries(env).filter(([, value]) => typeof value === 'string'),
)

export class AgentContainer extends Container {
  sleepAfter = '10m'
  defaultPort = PORT

  envVars = {
    ...containerEnv,
    PORT: PORT.toString(),
  }

  healthFailures = 0

  override async onStart(): Promise<void> {
    console.info('[container] onStart — connecting gateway watcher')
    this.healthFailures = 0
    this.watchGateway()

    setInterval(() => {
      this.healthCheck().catch((error) => {
        console.error('[container] health check loop error:', error)
      })
    }, HEALTH_CHECK_INTERVAL_MS)
  }

  // Fix 3: liveness probe with auto-recovery. The June wedge (FUSE stall →
  // D-state processes → unresponsive gateway) had no way out except a manual
  // redeploy; Docker HEALTHCHECK is ignored by Cloudflare Containers.
  async healthCheck(): Promise<void> {
    // Never probe a sleeping container — containerFetch would wake it.
    const state = await this.getState()
    if (state.status !== 'running' && state.status !== 'healthy') return

    let healthy = false
    try {
      const res = await this.containerFetch('http://container/health', {
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      })
      healthy = res.ok
    } catch {
      healthy = false
    }

    if (healthy) {
      this.healthFailures = 0
      if (inDreamWindow()) this.renewActivityTimeout()
      return
    }

    this.healthFailures++
    console.warn(`[container] health check failed (${this.healthFailures}/${MAX_HEALTH_FAILURES})`)
    if (this.healthFailures < MAX_HEALTH_FAILURES) return

    console.error('[container] gateway unresponsive — destroying wedged container')
    this.healthFailures = 0
    try {
      await this.destroy()
    } catch (error) {
      console.error('[container] destroy failed:', error)
      return
    }
    // Restart immediately: the chat bridge lives inside the container, so
    // without it non-mention Google Chat messages would never arrive to wake us.
    try {
      await this.start()
      console.info('[container] restarted after wedge')
    } catch (error) {
      console.error('[container] restart failed (next request will retry):', error)
    }
  }

  // Fix 1: renew the DO activity timeout on gateway work. The DO only sees
  // requests routed through the Worker; bridge posts to localhost and long
  // agent runs are invisible, so without this the 10m sleepAfter fires
  // mid-task and SIGKILLs the run.
  async watchGateway(): Promise<void> {
    try {
      const res = await this.containerFetch('http://container/', {
        headers: { Upgrade: 'websocket' },
      })
      if (res.webSocket === null) throw new Error('gateway did not upgrade to WebSocket')
      const ws = res.webSocket

      ws.addEventListener('message', (msg) => {
        try {
          const frame = JSON.parse(msg.data as string)
          if (frame.type === 'event' && ACTIVITY_EVENTS.has(frame.event)) {
            this.renewActivityTimeout()
          }
          if (frame.type === 'res' && frame.id === '1') {
            console.info(
              frame.ok
                ? '[container] gateway watcher connected'
                : '[container] gateway watcher rejected',
            )
          }
        } catch {
          // Non-JSON frame — ignore.
        }
      })

      ws.addEventListener('close', () => {
        console.warn('[container] gateway watcher closed — reconnecting in 30s')
        setTimeout(() => {
          this.reconnectGateway().catch((error) => {
            console.error('[container] gateway reconnect error:', error)
          })
        }, WS_RECONNECT_DELAY_MS)
      })

      ws.accept()
      ws.send(
        JSON.stringify({
          type: 'req',
          id: '1',
          method: 'connect',
          params: {
            // OpenClaw 2026.8.1 bumped the gateway protocol to v4 with
            // MIN_CLIENT_PROTOCOL_VERSION=4; offering only v3 made the gateway
            // reject this operator connect ("closed before connect"), so the DO
            // never renewed activity and the container drained mid-conversation.
            // Range 3–4 keeps it working against both the beta and a v3 rollback.
            minProtocol: 3,
            maxProtocol: 4,
            client: { id: 'cf-do-watcher', version: '1.0.0', platform: 'cloudflare', mode: 'cli' },
            role: 'operator',
            scopes: ['operator.read'],
            auth: { token: env.OPENCLAW_GATEWAY_TOKEN },
          },
        }),
      )
    } catch (error) {
      console.error('[container] gateway watcher connection failed:', error)
      setTimeout(() => {
        this.reconnectGateway().catch(() => {})
      }, WS_RECONNECT_DELAY_MS)
    }
  }

  // Only reconnect while the container is actually up — containerFetch on a
  // stopped container would wake it, turning the reconnect loop into an
  // accidental keep-alive. onStart re-establishes the watcher on next boot.
  async reconnectGateway(): Promise<void> {
    const state = await this.getState()
    if (state.status !== 'running' && state.status !== 'healthy') {
      console.info('[container] container not running — skipping gateway reconnect')
      return
    }
    await this.watchGateway()
  }
}

// Nightly dream sweep (02:50–04:30 UTC) runs with no inbound traffic;
// renew through it so the container does not sleep mid-dream.
function inDreamWindow(): boolean {
  const now = new Date()
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return (hour === 2 && minute >= 50) || hour === 3 || (hour === 4 && minute <= 30)
}

const SINGLETON_CONTAINER_ID = 'cf-singleton-container'

// port targets a non-default container port (e.g. the Telegram webhook listener
// on 8787). Omit to hit the gateway on defaultPort. Either way this wakes a
// sleeping container, which is why Telegram webhooks route through here.
export async function forwardRequestToContainer(request: Request, port?: number) {
  const objectId = env.AGENT_CONTAINER.idFromName(SINGLETON_CONTAINER_ID)
  const container = env.AGENT_CONTAINER.get(objectId, { locationHint: 'wnam' })
  return container.fetch(port ? switchPort(request, port) : request)
}
