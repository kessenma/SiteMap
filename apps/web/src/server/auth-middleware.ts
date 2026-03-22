import { auth } from '#/lib/auth'
import { getRequest } from '@tanstack/react-start/server'

export async function getAuthSession() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireRole(roles: string[]) {
  const session = await getAuthSession()
  if (!roles.includes(session.user.role as string)) {
    throw new Error('Forbidden')
  }
  return session
}
