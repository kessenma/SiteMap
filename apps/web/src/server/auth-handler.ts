import { auth } from '#/lib/auth'

/**
 * Better Auth request handler.
 * This is called from the custom Bun server (server.ts) for /api/auth/* routes.
 * Better Auth handles all sub-routes internally (sign-in, sign-up, sign-out, session, etc.)
 */
export async function handleAuthRequest(request: Request): Promise<Response> {
  return auth.handler(request)
}
