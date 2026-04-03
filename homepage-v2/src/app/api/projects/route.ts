import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const featured = request.nextUrl.searchParams.get('featured')

  const projects = await prisma.project.findMany({
    where: featured === 'true' ? { featured: true } : undefined,
    orderBy: { sortOrder: 'asc' },
  })

  return Response.json({ projects })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const project = await prisma.project.create({
    data: {
      title: body.title,
      description: body.description,
      url: body.url ?? null,
      imageUrl: body.imageUrl ?? null,
      tags: JSON.stringify(body.tags ?? []),
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
    },
  })

  return Response.json(project, { status: 201 })
}
