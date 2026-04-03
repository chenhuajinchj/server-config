import { cookies } from 'next/headers'

export async function hashToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + process.env.ADMIN_SECRET)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')
  if (!token) return false

  const expected = await hashToken(process.env.ADMIN_PASSWORD || '')
  return token.value === expected
}
