import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db'
import { pushDevices } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { getAuthSession } from './auth-middleware'

export const registerDeviceToken = createServerFn({ method: 'POST' })
  .inputValidator((input: {
    token: string
    platform: 'ios' | 'android'
    environment?: 'dev' | 'prod'
    deviceId?: string
    deviceModel?: string
    appVersion?: string
    buildNumber?: string
  }) => input)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    const result = await db
      .insert(pushDevices)
      .values({
        userId: session.user.id,
        platform: data.platform,
        token: data.token,
        environment: data.environment ?? 'prod',
        isActive: true,
        lastSeenAt: new Date(),
        deviceId: data.deviceId ?? null,
        deviceModel: data.deviceModel ?? null,
        appVersion: data.appVersion ?? null,
        buildNumber: data.buildNumber ?? null,
      })
      .onConflictDoUpdate({
        target: [pushDevices.token, pushDevices.platform, pushDevices.environment],
        set: {
          userId: session.user.id,
          isActive: true,
          lastSeenAt: new Date(),
          deviceId: data.deviceId ?? null,
          deviceModel: data.deviceModel ?? null,
          appVersion: data.appVersion ?? null,
          buildNumber: data.buildNumber ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: pushDevices.id,
        platform: pushDevices.platform,
        environment: pushDevices.environment,
      })

    return { success: true, device: result[0] }
  })

export const getMyDeviceTokens = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getAuthSession()

  const devices = await db
    .select()
    .from(pushDevices)
    .where(and(
      eq(pushDevices.userId, session.user.id),
      eq(pushDevices.isActive, true),
    ))

  const ios = devices.filter((d) => d.platform === 'ios')
  const android = devices.filter((d) => d.platform === 'android')

  return { devices: { ios, android }, totalActive: devices.length }
})

export const deactivateDeviceToken = createServerFn({ method: 'POST' })
  .inputValidator((input: { token?: string; platform?: string }) => input)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    const conditions = [eq(pushDevices.userId, session.user.id)]

    if (data.token) {
      conditions.push(eq(pushDevices.token, data.token))
    }
    if (data.platform) {
      conditions.push(eq(pushDevices.platform, data.platform as 'ios' | 'android'))
    }

    await db
      .update(pushDevices)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(...conditions))

    return { success: true }
  })
