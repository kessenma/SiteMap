import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  // Use relative URLs in dev so cookies are sent on the same origin.
  // Only set baseURL in production if the API is on a different domain.
  ...(import.meta.env.VITE_APP_URL ? { baseURL: import.meta.env.VITE_APP_URL } : {}),
  plugins: [
    twoFactorClient(),
  ],
})

export const { signIn, signUp, signOut, useSession, twoFactor } = authClient
