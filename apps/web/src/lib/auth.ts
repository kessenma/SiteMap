import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { sql } from 'drizzle-orm'
import { db } from '#/db'
import * as schema from '#/db/schema'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      twoFactor: schema.twoFactors,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // flip to true when an email provider is configured
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        defaultValue: '',
        input: true,
      },
      lastName: {
        type: 'string',
        defaultValue: '',
        input: true,
      },
      role: {
        type: 'string',
        defaultValue: 'technician',
        input: true,
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // First user to sign up automatically becomes admin
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.users)
          if (count === 0) {
            return { data: { ...user, role: 'admin' } }
          }
          return { data: user }
        },
      },
    },
  },
  session: {
    expiresIn: 14 * 24 * 60 * 60, // 14 days
    updateAge: 24 * 60 * 60, // refresh session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min client-side cache
    },
  },
  advanced: {
    cookiePrefix: 'sitemap',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [
    twoFactor({
      issuer: 'SiteMap',
    }),
  ],
  trustedOrigins: [
    'http://localhost:3000',
    process.env.PROD_API_URL || 'https://sitemap.live',
    'sitemap-mobile://', // React Native mobile app
  ],
})
