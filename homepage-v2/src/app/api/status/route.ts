import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function checkHealth(url: string): Promise<{ status: 'up' | 'down'; responseTime: number }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    return { status: 'up', responseTime: Date.now() - start }
  } catch {
    return { status: 'down', responseTime: Date.now() - start }
  }
}

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const results = await Promise.all(
    services.map(async (service) => {
      const health = await checkHealth(service.url)
      return {
        name: service.name,
        url: service.url,
        icon: service.icon,
        ...health,
      }
    })
  )

  return Response.json(results)
}
