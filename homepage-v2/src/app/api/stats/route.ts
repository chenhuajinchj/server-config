import { type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const headersList = await headers()

  await prisma.pageView.create({
    data: {
      path: body.path,
      referrer: body.referrer ?? null,
      userAgent: headersList.get('user-agent') ?? null,
      ip: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    },
  })

  return Response.json({ success: true })
}

export async function GET() {
  const totalViews = await prisma.pageView.count()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const viewsToday = await prisma.pageView.count({
    where: { createdAt: { gte: todayStart } },
  })

  const topPages = await prisma.pageView.groupBy({
    by: ['path'],
    _count: { path: true },
    orderBy: { _count: { path: 'desc' } },
    take: 10,
  })

  return Response.json({
    totalViews,
    viewsToday,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
  })
}
