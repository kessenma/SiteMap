# Authentication Reference

Detailed auth reference for the SiteMap monorepo. For full documentation with diagrams and env var setup, see `docs/authentication.md`.

## Architecture Overview

```
Mobile App                          Web App                         Server (Bun/Vite)
───────────                         ───────                         ────────────────
AuthService.ts  ─── REST ───→       auth-client.ts ─── fetch ───→  /api/auth/*
usePasskey.ts   ─── REST ───→       usePasskey.ts  ─── fetch ───→  /api/auth/webauthn/*
                                                                    │
                                                                    ├── better-auth handler (sign-in, sign-up, session, 2FA)
                                                                    ├── webauthn.ts (register, authenticate)
                                                                    └── PostgreSQL (users, sessions, passkey_credentials, two_factors)
```

## Key Files

### Server (apps/web)
| File | Purpose |
|---|---|
| `src/lib/auth.ts` | better-auth server config — drizzle adapter, twoFactor plugin, user additionalFields (role, isActive) |
| `src/lib/auth-client.ts` | better-auth React client — twoFactorClient plugin, exports signIn/signUp/signOut/useSession/twoFactor |
| `src/server/auth-handler.ts` | Passes requests to `auth.handler()` |
| `src/server/webauthn.ts` | Custom WebAuthn handlers — register options/verify, authenticate options/verify |
| `src/server/mobile-auth.ts` | Mobile JWT token endpoints |
| `src/db/schema.ts` | All Drizzle tables including auth tables |

### Web Client (apps/web)
| File | Purpose |
|---|---|
| `src/hooks/usePasskey.ts` | WebAuthn hook — `register(email, userId?)`, `authenticate(email?)`, `isSupported` |
| `src/routes/_auth.tsx` | Auth layout — centered, no sidebar, redirects to `/dashboard` if logged in |
| `src/routes/_auth/login.tsx` | Login page — email/password, passkey, 2FA TOTP verification |
| `src/routes/_auth/signup.tsx` | Signup — 3 steps: role selection → credentials → 2FA/passkey setup |
| `src/routes/_app.tsx` | App layout — sidebar, auth guard redirects to `/login` if not authenticated |

### Mobile Client (apps/mobile)
| File | Purpose |
|---|---|
| `src/services/AuthService.ts` | REST client — signIn, signUp, signOut, getSession, enableTotp, verifyTotp |
| `src/hooks/usePasskey.ts` | Native passkey hook — `register(email, userId?)`, `authenticate(email?)`, `isSupported` |
| `src/contexts/AuthContext.tsx` | Auth state — user, isAuthenticated, isLoading, login, signup, verifyTotp, logout |
| `src/screens/auth/LoginScreen.tsx` | Login — email/password, passkey button, 2FA inline |
| `src/screens/auth/SignupScreen.tsx` | Signup — 3 steps: role → credentials → 2FA/passkey |
| `src/navigation/MainNavigator.tsx` | Auth gating — shows auth screens when !isAuthenticated |

### Shared (packages/shared)
| File | Purpose |
|---|---|
| `src/auth/index.ts` | `loginSchema`, `signupSchema`, `USER_ROLE_OPTIONS`, `TOTP_CONFIG` |
| `src/schema/enums.ts` | `userRoleEnum` — admin, operator, technician |
| `src/schema/tables.ts` | TABLE_NAMES and COLUMNS for auth tables |

## Route Handling

All `/api/auth/*` requests are intercepted before TanStack Start SSR:

- **Dev**: Vite plugin `authMiddleware()` in `vite.config.ts`
- **Prod**: Bun `server.ts` `fetch()` handler

Priority order:
1. `/api/auth/mobile-token` → `mobile-auth.ts`
2. `/api/auth/refresh-token` → `mobile-auth.ts`
3. `/api/auth/webauthn/*` → `webauthn.ts`
4. Everything else → `auth-handler.ts` → better-auth

## WebAuthn / Passkey Flow

Uses `@simplewebauthn/server` + `@simplewebauthn/browser` (web) and `react-native-passkey` (mobile). Challenge tokens are signed JWTs (via `jose`) instead of cookies — works for both web and mobile.

### Registration (during signup step 3)
1. Client → `POST /api/auth/webauthn/register/options` with `{ email, userId? }`
2. Server generates options via `generateRegistrationOptions()`, returns options + signed `challengeToken`
3. Client triggers WebAuthn prompt (`startRegistration` on web, `Passkey.create` on mobile)
4. Client → `POST /api/auth/webauthn/register/verify` with `{ credential, challengeToken, deviceName }`
5. Server verifies via `verifyRegistrationResponse()`, stores in `passkey_credentials` table (or returns `pendingCredential` for signup flow)

### Authentication (login)
1. Client → `POST /api/auth/webauthn/authenticate/options` with `{ email? }`
2. Server generates options (targeted if email provided, discoverable if not), returns options + `challengeToken`
3. Client triggers WebAuthn prompt (`startAuthentication` / `Passkey.get`)
4. Client → `POST /api/auth/webauthn/authenticate/verify` with `{ credential, challengeToken }`
5. Server verifies, updates counter, returns short-lived `passkeyToken` JWT

## 2FA (TOTP) Flow

Uses better-auth's `twoFactor` plugin.

### Enable (during signup)
1. `authClient.twoFactor.enable({ password })` → returns `{ totpURI, backupCodes }`
2. User adds to authenticator app via the secret extracted from `totpURI`
3. `authClient.twoFactor.verifyTotp({ code })` → confirms setup

### Login with 2FA
1. `authClient.signIn.email()` returns error with code `TWO_FACTOR_REQUIRED`
2. UI shows TOTP input
3. `authClient.twoFactor.verifyTotp({ code })` → completes login

## Database Tables

Auth-specific tables in `apps/web/src/db/schema.ts`:

- **users** — id (uuid), email, name, role, emailVerified, image, isActive, twoFactorEnabled
- **sessions** — id, userId, token (unique), expiresAt, ipAddress, userAgent
- **accounts** — id, userId, accountId, providerId, password (hashed), tokens
- **verifications** — id, identifier, value, expiresAt
- **two_factors** — id, userId, secret, backupCodes, enabled
- **passkey_credentials** — id, userId, credentialId (unique), publicKey, counter, deviceType, backedUp, transports (JSON), deviceName, isActive, lastUsedAt

## Environment Variables

```
JWT_SECRET=           # Signs WebAuthn challenge tokens and mobile auth tokens
WEBAUTHN_RP_ID=       # Relying Party ID (e.g., localhost or sitemap.yourdomain.com)
WEBAUTHN_RP_NAME=     # Display name (defaults to "SiteMap")
WEBAUTHN_ORIGIN=      # Expected origin (e.g., http://localhost:3000)
WEBAUTHN_ANDROID_ORIGIN=  # Optional Android APK key hash origin
```

## Common Tasks

### Adding a new auth-related field to users
1. Add column to `packages/shared/src/schema/tables.ts` COLUMNS.users
2. Add to Drizzle table in `apps/web/src/db/schema.ts`
3. If needed by better-auth, add to `additionalFields` in `apps/web/src/lib/auth.ts`
4. Update `AuthUser` interface in `apps/mobile/src/services/AuthService.ts`
5. Run migration: `pnpm --filter @sitemap/web drizzle-kit generate && drizzle-kit push`

### Adding a new auth provider
better-auth supports OAuth providers. Add the provider plugin to `auth.ts` and the corresponding client plugin to `auth-client.ts`. No WebAuthn changes needed.
