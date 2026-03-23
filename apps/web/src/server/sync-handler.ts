import { jwtVerify } from 'jose'
import { db } from '#/db'
import { sql } from 'drizzle-orm'

const JWT_SECRET = Buffer.from(process.env.JWT_SECRET!, 'base64')
const ISSUER = process.env.PROD_API_URL || 'https://sitemap.live'

// Tables that the mobile app is allowed to write to via /api/sync
const ALLOWED_TABLES = new Set([
  'facilities',
  'projects',
  'maps',
  'map_keys',
  'map_markers',
  'marker_photos',
  'map_comments',
  'comment_replies',
  'comment_reactions',
  'comment_photos',
  'map_paths',
  'map_lists',
  'map_list_items',
  'list_item_photos',
  'user_facilities',
  'teammates',
])

async function authenticateRequest(request: Request): Promise<{ userId: string } | null> {
  // Try JWT Bearer token first (mobile)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(
        authHeader.slice(7),
        JWT_SECRET,
        { issuer: ISSUER, audience: ['powersync', 'powersync-dev'] },
      )
      if (payload.sub) return { userId: payload.sub }
    } catch {}
  }

  // Fall back to session cookie (web)
  const cookie = request.headers.get('Cookie')
  if (cookie) {
    try {
      const { auth } = await import('#/lib/auth')
      const session = await auth.api.getSession({ headers: request.headers })
      if (session?.user?.id) return { userId: session.user.id }
    } catch {}
  }

  return null
}

/**
 * Handle PUT/DELETE /api/sync/:table
 * Accepts { id, ...columns } from PowerSync uploadData.
 */
export async function handleSync(request: Request): Promise<Response> {
  const user = await authenticateRequest(request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const table = pathParts[pathParts.length - 1]

  if (!table || !ALLOWED_TABLES.has(table)) {
    return Response.json({ error: `Table "${table}" is not allowed` }, { status: 400 })
  }

  try {
    const record = await request.json()
    const { id } = record

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 })
    }

    if (request.method === 'DELETE') {
      await db.execute(sql`DELETE FROM ${sql.identifier(table)} WHERE id = ${id}`)
      return Response.json({ ok: true })
    }

    // PUT — upsert
    const { id: _id, ...data } = record
    const columns = Object.keys(data)

    if (columns.length === 0) {
      await db.execute(
        sql`INSERT INTO ${sql.identifier(table)} (id) VALUES (${id}) ON CONFLICT (id) DO NOTHING`,
      )
      return Response.json({ ok: true })
    }

    // Build dynamic upsert with sql template tag for safety
    const colIdentifiers = columns.map((c) => sql.identifier(c))
    const colValues = columns.map((c) => data[c])

    // INSERT INTO "table" (id, col1, col2) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET col1=$2, col2=$3
    const insertCols = sql.join([sql.identifier('id'), ...colIdentifiers], sql`, `)
    const insertVals = sql.join([sql`${id}`, ...colValues.map((v) => sql`${v}`)], sql`, `)
    const updateSet = sql.join(
      columns.map((c, i) => sql`${sql.identifier(c)} = ${colValues[i]}`),
      sql`, `,
    )

    await db.execute(
      sql`INSERT INTO ${sql.identifier(table)} (${insertCols}) VALUES (${insertVals}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
    )

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(`[sync-handler] Error for ${table}:`, err)
    return Response.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
