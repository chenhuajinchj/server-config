import { isAdmin } from '@/lib/auth'

export async function GET() {
  const authenticated = await isAdmin()
  return Response.json({ authenticated })
}
