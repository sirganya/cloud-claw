import { Container } from '@cloudflare/containers'
import { env } from 'cloudflare:workers'

const PORT = 6658

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

  override async onStart(): Promise<void> {
    console.info('[container] onStart v2 — no operator WebSocket')

    setInterval(async () => {
      const now = new Date()
      const irish = new Intl.DateTimeFormat('en-IE', {
        timeZone: 'Europe/Dublin',
        hour: 'numeric',
        hour12: false,
      }).format(now)
      const hour = parseInt(irish, 10)
      const isBusinessHours = hour >= 8 && hour < 20

      if (!isBusinessHours) return

      try {
        const res = await this.containerFetch('http://container/health')
        if (res.ok) {
          this.renewActivityTimeout()
        }
      } catch {
        console.warn('[container] health check failed — gateway not ready')
      }
    }, 5 * 60_000)
  }
}

const SINGLETON_CONTAINER_ID = 'cf-singleton-container'

export async function forwardRequestToContainer(request: Request) {
  const objectId = env.AGENT_CONTAINER.idFromName(SINGLETON_CONTAINER_ID)
  const container = env.AGENT_CONTAINER.get(objectId, { locationHint: 'wnam' })
  return container.fetch(request)
}
