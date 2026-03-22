import { useState, useCallback, useEffect } from 'react'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types'

interface PasskeyCredentialData {
  credentialId: string
  publicKey: string
  counter: number
  credentialDeviceType: string
  credentialBackedUp: boolean
  transports: string[]
  deviceName: string
  aaguid: string
}

interface RegisterResult {
  verified: boolean
  pendingCredential?: PasskeyCredentialData
  email?: string
  tempUserId?: string
  message?: string
}

interface AuthenticateResult {
  verified: boolean
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function usePasskey() {
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported(browserSupportsWebAuthn())
  }, [])

  const register = useCallback(
    async (email: string, userId?: string, deviceName?: string): Promise<RegisterResult> => {
      if (!isSupported) throw new Error('Passkeys are not supported on this device/browser')

      setIsLoading(true)
      setError(null)

      try {
        // 1. Get registration options
        const optionsRes = await fetch('/api/auth/webauthn/register/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId }),
        })

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json()
          throw new Error(errorData.error || 'Failed to get registration options')
        }

        const { challengeToken, ...registrationOptions } = await optionsRes.json()

        // 2. Trigger browser WebAuthn prompt
        let credential: RegistrationResponseJSON
        try {
          credential = await startRegistration({ optionsJSON: registrationOptions })
        } catch (err: any) {
          if (err.name === 'NotAllowedError') throw new Error('Passkey registration was cancelled')
          throw err
        }

        // 3. Verify with server
        const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential,
            userId,
            deviceName: deviceName || 'My Device',
            challengeToken,
          }),
        })

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json()
          throw new Error(errorData.error || 'Failed to verify registration')
        }

        return await verifyRes.json()
      } catch (err: any) {
        const msg = err.message || 'Passkey registration failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isSupported],
  )

  const authenticate = useCallback(
    async (email?: string): Promise<AuthenticateResult> => {
      if (!isSupported) throw new Error('Passkeys are not supported on this device/browser')

      setIsLoading(true)
      setError(null)

      try {
        // 1. Get authentication options
        const optionsRes = await fetch('/api/auth/webauthn/authenticate/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || undefined }),
        })

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json()
          throw new Error(errorData.error || 'No passkey found for this account')
        }

        const { challengeToken, ...authOptions } = await optionsRes.json()

        // 2. Trigger browser WebAuthn prompt
        let credential: AuthenticationResponseJSON
        try {
          credential = await startAuthentication({ optionsJSON: authOptions })
        } catch (err: any) {
          if (err.name === 'NotAllowedError') throw new Error('Passkey authentication was cancelled')
          throw err
        }

        // 3. Verify with server
        const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential, email: email || undefined, challengeToken }),
        })

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json()
          throw new Error(errorData.error || 'Passkey authentication failed')
        }

        return await verifyRes.json()
      } catch (err: any) {
        const msg = err.message || 'Passkey authentication failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [isSupported],
  )

  const clearError = useCallback(() => setError(null), [])

  return { isSupported, isLoading, error, register, authenticate, clearError }
}
