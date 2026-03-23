import { SignJWT, jwtVerify } from 'jose'
import { verifyPassword } from 'better-auth/crypto'
import { db } from '#/db'
import { users, accounts } from '#/db/schema'
import { eq, and } from 'drizzle-orm'

const JWT_SECRET = Buffer.from(process.env.JWT_SECRET!, 'base64')
const ISSUER = process.env.PROD_API_URL || 'https://sitemap.live'

async function signUserJwt(user: { id: string; email: string; firstName: string; lastName: string; role: string }) {
  return new SignJWT({
    sub: user.id,
    user_id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256', kid: 'sitemap-key' })
    .setIssuer(ISSUER)
    .setAudience(['powersync', 'powersync-dev'])
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(JWT_SECRET)
}

/**
 * POST /api/auth/mobile-token
 * Authenticates mobile users and returns a JWT compatible with PowerSync.
 */
export async function handleMobileToken(request: Request): Promise<Response> {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credential')))
    if (!account?.password) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword({ hash: account.password, password })
    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ error: 'Account deactivated' }, { status: 403 })
    }

    const token = await signUserJwt(user)

    return Response.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/auth/refresh-token
 * Refreshes a mobile JWT. Expects Authorization: Bearer <token> header.
 */
export async function handleRefreshToken(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing token' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      audience: ['powersync', 'powersync-dev'],
    })

    const userId = payload.sub
    if (!userId) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user || !user.isActive) {
      return Response.json({ error: 'Account not found or deactivated' }, { status: 403 })
    }

    const newToken = await signUserJwt(user)

    return Response.json({
      token: newToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    })
  } catch {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}
