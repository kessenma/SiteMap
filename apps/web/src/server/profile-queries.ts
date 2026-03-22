import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db'
import { users, facilities, userFacilities, teammates } from '#/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getAuthSession } from './auth-middleware'
import { alias } from 'drizzle-orm/pg-core'

export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getAuthSession()
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user) throw new Error('User not found')
  return {
    ...user,
    imageUrl: user.image ? `/api/files?path=${encodeURIComponent(user.image)}` : null,
  }
})

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: { firstName: string; lastName: string; image?: string | null }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const name = `${data.firstName} ${data.lastName}`.trim()
    const [updated] = await db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        name,
        ...(data.image !== undefined ? { image: data.image } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning()
    return updated
  })

export const getUserFacilities = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getAuthSession()
  const result = await db
    .select({
      id: userFacilities.id,
      facilityId: facilities.id,
      facilityName: facilities.name,
      facilityAddress: facilities.address,
      createdAt: userFacilities.createdAt,
    })
    .from(userFacilities)
    .innerJoin(facilities, eq(userFacilities.facilityId, facilities.id))
    .where(eq(userFacilities.userId, session.user.id))
    .orderBy(asc(facilities.name))
  return result
})

export const addUserFacility = createServerFn({ method: 'POST' })
  .inputValidator((data: { facilityId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [uf] = await db
      .insert(userFacilities)
      .values({ userId: session.user.id, facilityId: data.facilityId })
      .onConflictDoNothing()
      .returning()
    return uf ?? null
  })

export const removeUserFacility = createServerFn({ method: 'POST' })
  .inputValidator((data: { facilityId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    await db
      .delete(userFacilities)
      .where(and(eq(userFacilities.userId, session.user.id), eq(userFacilities.facilityId, data.facilityId)))
  })

export const getTeammates = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getAuthSession()
  const teammateUser = alias(users, 'teammate_user')
  const result = await db
    .select({
      id: teammates.id,
      teammateId: teammates.teammateId,
      role: teammates.role,
      createdAt: teammates.createdAt,
      name: teammateUser.name,
      email: teammateUser.email,
      image: teammateUser.image,
      userRole: teammateUser.role,
    })
    .from(teammates)
    .innerJoin(teammateUser, eq(teammates.teammateId, teammateUser.id))
    .where(eq(teammates.userId, session.user.id))
    .orderBy(asc(teammateUser.name))

  return result.map((t) => ({
    ...t,
    imageUrl: t.image ? `/api/files?path=${encodeURIComponent(t.image)}` : null,
  }))
})

export const addTeammate = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; role: 'team_member' | 'manager' }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!target) throw new Error('User not found with that email')
    if (target.id === session.user.id) throw new Error('Cannot add yourself as a teammate')

    const [tm] = await db
      .insert(teammates)
      .values({ userId: session.user.id, teammateId: target.id, role: data.role })
      .onConflictDoNothing()
      .returning()

    if (!tm) throw new Error('Teammate already added')
    return tm
  })

export const updateTeammateRole = createServerFn({ method: 'POST' })
  .inputValidator((data: { teammateId: string; role: 'team_member' | 'manager' }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    const [updated] = await db
      .update(teammates)
      .set({ role: data.role, updatedAt: new Date() })
      .where(and(eq(teammates.userId, session.user.id), eq(teammates.teammateId, data.teammateId)))
      .returning()
    return updated
  })

export const removeTeammate = createServerFn({ method: 'POST' })
  .inputValidator((data: { teammateId: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()
    await db
      .delete(teammates)
      .where(and(eq(teammates.userId, session.user.id), eq(teammates.teammateId, data.teammateId)))
  })

export const searchUsers = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    await getAuthSession()
    const { ilike, or } = await import('drizzle-orm')
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`)))
      .limit(10)
    return result
  })
