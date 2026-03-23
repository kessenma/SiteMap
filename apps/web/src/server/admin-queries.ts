import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db'
import { users } from '#/db/schema'
import { count, desc, eq, and } from 'drizzle-orm'
import { requireRole } from './auth-middleware'

async function getAdminCount() {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true)))
  return result.count
}

export const getStorageConfig = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(['admin'])
  return {
    url: process.env.SERVICE_URL_RUSTFS_SERVER ?? '',
    key: process.env.OBJECT_STORAGE_KEY ?? '',
    secret: process.env.OBJECT_STORAGE_SECRET ?? '',
  }
})

export const getAllUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(['admin'])
  return db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
})

export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string; role: 'admin' | 'operator' | 'technician' }) => input)
  .handler(async ({ data }) => {
    await requireRole(['admin'])
    if (data.role !== 'admin') {
      const [current] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, data.userId))
      if (current?.role === 'admin') {
        const adminCount = await getAdminCount()
        if (adminCount <= 1) {
          throw new Error('Cannot remove the last admin')
        }
      }
    }
    await db
      .update(users)
      .set({ role: data.role, updatedAt: new Date() })
      .where(eq(users.id, data.userId))
    return { success: true }
  })

export const checkPowerSyncHealth = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(['admin'])
  const url = process.env.PROD_POWERSYNC_URL || 'https://sync.sitemap.live'
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${url}/probes/liveness`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return {
      url,
      status: res.status,
      ok: res.ok,
      error: null,
    }
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
})

export const toggleUserActive = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string; isActive: boolean }) => input)
  .handler(async ({ data }) => {
    await requireRole(['admin'])
    if (!data.isActive) {
      const [current] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, data.userId))
      if (current?.role === 'admin') {
        const adminCount = await getAdminCount()
        if (adminCount <= 1) {
          throw new Error('Cannot deactivate the last admin')
        }
      }
    }
    await db
      .update(users)
      .set({ isActive: data.isActive, updatedAt: new Date() })
      .where(eq(users.id, data.userId))
    return { success: true }
  })
