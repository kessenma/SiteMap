import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '#/db'
import { passkeyCredentials, users } from '#/db/schema'
import { eq, and } from 'drizzle-orm'

// WebAuthn Relying Party configuration
const rpName = process.env.WEBAUTHN_RP_NAME || 'SiteMap'
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost'
const webOrigin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'
const androidOrigin = process.env.WEBAUTHN_ANDROID_ORIGIN

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
  return new TextEncoder().encode(secret)
}

function getExpectedOrigins(): string[] {
  const origins = [webOrigin]
  if (androidOrigin) origins.push(androidOrigin)
  return origins
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Registration Options ────────────────────────────────────────────────────

export async function handleRegisterOptions(request: Request): Promise<Response> {
  try {
    const { email, userId } = await request.json() as { email?: string; userId?: string }

    if (!email) {
      return jsonResponse({ error: 'Email is required' }, 400)
    }

    const normalizedEmail = email.toLowerCase().trim()

    let userIdToUse = userId
    let existingUser = null

    if (userId) {
      existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) })
      if (!existingUser) return jsonResponse({ error: 'User not found' }, 404)
    } else {
      existingUser = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) })
      if (existingUser) {
        userIdToUse = existingUser.id
      } else {
        userIdToUse = crypto.randomUUID()
      }
    }

    const existingCredentials = existingUser
      ? await db.query.passkeyCredentials.findMany({
          where: and(
            eq(passkeyCredentials.userId, existingUser.id),
            eq(passkeyCredentials.isActive, true),
          ),
        })
      : []

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(userIdToUse),
      userName: normalizedEmail,
      userDisplayName: existingUser?.firstName ? `${existingUser.firstName} ${existingUser.lastName}` : normalizedEmail,
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      attestationType: 'none',
    })

    // Create signed challenge token (works for both web and mobile)
    const challengeToken = await new SignJWT({
      challenge: options.challenge,
      userId: userIdToUse,
      email: normalizedEmail,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(getJwtSecret())

    return jsonResponse({ ...options, challengeToken })
  } catch (error) {
    console.error('WebAuthn registration options error:', error)
    return jsonResponse({ error: 'Failed to generate registration options' }, 500)
  }
}

// ─── Registration Verify ─────────────────────────────────────────────────────

export async function handleRegisterVerify(request: Request): Promise<Response> {
  try {
    const { credential, userId, deviceName, challengeToken } = await request.json() as {
      credential: RegistrationResponseJSON
      userId?: string
      deviceName?: string
      challengeToken?: string
    }

    if (!credential) return jsonResponse({ error: 'Credential is required' }, 400)

    // Extract challenge from token
    let storedChallenge: string | undefined
    let storedUserId: string | undefined
    let storedEmail: string | undefined

    if (challengeToken) {
      try {
        const { payload } = await jwtVerify(challengeToken, getJwtSecret())
        storedChallenge = payload.challenge as string
        storedUserId = userId || (payload.userId as string)
        storedEmail = payload.email as string
      } catch {
        return jsonResponse({ error: 'Invalid or expired challenge token' }, 400)
      }
    }

    if (!storedChallenge) return jsonResponse({ error: 'Challenge not found' }, 400)
    if (!storedUserId) return jsonResponse({ error: 'User ID not found' }, 400)

    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: storedChallenge,
        expectedOrigin: getExpectedOrigins(),
        expectedRPID: rpID,
        requireUserVerification: true,
      })
    } catch (err: any) {
      console.error('WebAuthn verification error:', err)
      return jsonResponse({ error: err.message || 'Verification failed' }, 400)
    }

    if (!verification.verified || !verification.registrationInfo) {
      return jsonResponse({ error: 'Verification failed' }, 400)
    }

    const {
      credential: verifiedCredential,
      credentialDeviceType,
      credentialBackedUp,
      aaguid,
    } = verification.registrationInfo

    // Check if user exists in DB
    const existingUser = await db.query.users.findFirst({ where: eq(users.id, storedUserId) })

    if (!existingUser) {
      // Signup flow: return pending credential to be stored after account creation
      return jsonResponse({
        verified: true,
        pendingCredential: {
          credentialId: verifiedCredential.id,
          publicKey: Buffer.from(verifiedCredential.publicKey).toString('base64url'),
          counter: verifiedCredential.counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: credential.response.transports || [],
          deviceName: deviceName || 'My Device',
          aaguid,
        },
        email: storedEmail,
        tempUserId: storedUserId,
      })
    }

    // Existing user: store credential directly
    await db.insert(passkeyCredentials).values({
      userId: storedUserId,
      credentialId: verifiedCredential.id,
      publicKey: Buffer.from(verifiedCredential.publicKey).toString('base64url'),
      counter: verifiedCredential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: JSON.stringify(credential.response.transports || []),
      deviceName: deviceName || 'My Device',
      isActive: true,
    })

    return jsonResponse({ verified: true, message: 'Passkey registered successfully' })
  } catch (error) {
    console.error('WebAuthn registration verify error:', error)
    return jsonResponse({ error: 'Failed to verify registration' }, 500)
  }
}

// ─── Authentication Options ──────────────────────────────────────────────────

export async function handleAuthenticateOptions(request: Request): Promise<Response> {
  try {
    const { email } = await request.json() as { email?: string }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) })

      if (!user) return jsonResponse({ error: 'No account found with this email' }, 404)

      const credentials = await db.query.passkeyCredentials.findMany({
        where: and(
          eq(passkeyCredentials.userId, user.id),
          eq(passkeyCredentials.isActive, true),
        ),
      })

      if (credentials.length === 0) {
        return jsonResponse({ error: 'No passkeys registered for this account' }, 404)
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map((cred) => ({
          id: cred.credentialId,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        })),
        userVerification: 'required',
      })

      const challengeToken = await new SignJWT({
        challenge: options.challenge,
        userId: user.id,
        mode: 'targeted',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .sign(getJwtSecret())

      return jsonResponse({ ...options, challengeToken })
    } else {
      // Discoverable credentials mode
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: [],
        userVerification: 'required',
      })

      const challengeToken = await new SignJWT({
        challenge: options.challenge,
        mode: 'discoverable',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .sign(getJwtSecret())

      return jsonResponse({ ...options, challengeToken })
    }
  } catch (error) {
    console.error('WebAuthn authentication options error:', error)
    return jsonResponse({ error: 'Failed to generate authentication options' }, 500)
  }
}

// ─── Authentication Verify ───────────────────────────────────────────────────

export async function handleAuthenticateVerify(request: Request): Promise<Response> {
  try {
    const { credential, challengeToken } = await request.json() as {
      credential: AuthenticationResponseJSON
      email?: string
      challengeToken?: string
    }

    if (!credential) return jsonResponse({ error: 'Credential is required' }, 400)

    let storedChallenge: string | undefined
    let storedUserId: string | undefined
    let authMode: string | undefined

    if (challengeToken) {
      try {
        const { payload } = await jwtVerify(challengeToken, getJwtSecret())
        storedChallenge = payload.challenge as string
        storedUserId = payload.userId as string | undefined
        authMode = payload.mode as string | undefined
      } catch {
        return jsonResponse({ error: 'Invalid or expired challenge token' }, 400)
      }
    }

    if (!storedChallenge) return jsonResponse({ error: 'Challenge not found' }, 400)

    let credentialRecord
    let userId: string

    if (authMode === 'discoverable' || !storedUserId) {
      // Look up user from credential ID
      credentialRecord = await db.query.passkeyCredentials.findFirst({
        where: and(
          eq(passkeyCredentials.credentialId, credential.id),
          eq(passkeyCredentials.isActive, true),
        ),
      })
      if (!credentialRecord) return jsonResponse({ error: 'Passkey not found' }, 404)
      userId = credentialRecord.userId
    } else {
      userId = storedUserId
      credentialRecord = await db.query.passkeyCredentials.findFirst({
        where: and(
          eq(passkeyCredentials.credentialId, credential.id),
          eq(passkeyCredentials.userId, storedUserId),
          eq(passkeyCredentials.isActive, true),
        ),
      })
      if (!credentialRecord) return jsonResponse({ error: 'Passkey not found' }, 404)
    }

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: storedChallenge,
        expectedOrigin: getExpectedOrigins(),
        expectedRPID: rpID,
        credential: {
          id: credentialRecord.credentialId,
          publicKey: Buffer.from(credentialRecord.publicKey, 'base64url'),
          counter: Number(credentialRecord.counter),
          transports: credentialRecord.transports ? JSON.parse(credentialRecord.transports) : undefined,
        },
        requireUserVerification: true,
      })
    } catch (err: any) {
      console.error('WebAuthn auth verification error:', err)
      return jsonResponse({ error: err.message || 'Authentication failed' }, 400)
    }

    if (!verification.verified) {
      return jsonResponse({ error: 'Authentication failed' }, 400)
    }

    // Update counter for replay attack prevention
    await db
      .update(passkeyCredentials)
      .set({
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      })
      .where(eq(passkeyCredentials.id, credentialRecord.id))

    // Get user
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return jsonResponse({ error: 'User not found' }, 404)

    // Create a short-lived passkey auth token
    const passkeyToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      credentialId: credential.id,
      authMethod: 'passkey',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .sign(getJwtSecret())

    return jsonResponse({
      verified: true,
      token: passkeyToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('WebAuthn authentication verify error:', error)
    return jsonResponse({ error: 'Failed to verify authentication' }, 500)
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export async function handleWebAuthnRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method !== 'POST') return null

  switch (path) {
    case '/api/auth/webauthn/register/options':
      return handleRegisterOptions(request)
    case '/api/auth/webauthn/register/verify':
      return handleRegisterVerify(request)
    case '/api/auth/webauthn/authenticate/options':
      return handleAuthenticateOptions(request)
    case '/api/auth/webauthn/authenticate/verify':
      return handleAuthenticateVerify(request)
    default:
      return null
  }
}
