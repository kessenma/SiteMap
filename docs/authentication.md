# Authentication

## Overview

SiteMap uses a self-hosted authentication system built on:

- **[better-auth](https://better-auth.com)** v1.5.6 — handles email/password sign-in/sign-up, sessions, and TOTP two-factor authentication
- **[SimpleWebAuthn](https://simplewebauthn.dev)** — custom WebAuthn/passkey implementation for passwordless authentication
- **[react-native-passkey](https://github.com/nicklama/react-native-passkey)** — native passkey support on iOS/Android

All auth endpoints are served from the web app's server layer. The mobile app calls the same REST API.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Web App (Bun/Vite)                          │
│                                                                     │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  better-auth     │   │  webauthn.ts      │   │ mobile-auth.ts │  │
│  │  (auth.handler)  │   │  (SimpleWebAuthn) │   │ (JWT tokens)   │  │
│  │                  │   │                    │   │                │  │
│  │  • sign-in/up    │   │  • register opts   │   │  • mobile-token│  │
│  │  • sign-out      │   │  • register verify  │   │  • refresh     │  │
│  │  • get-session   │   │  • auth options    │   │                │  │
│  │  • 2FA enable    │   │  • auth verify     │   │                │  │
│  │  • 2FA verify    │   │                    │   │                │  │
│  └────────┬─────────┘   └────────┬───────────┘   └───────┬────────┘  │
│           │                      │                        │          │
│           └──────────────────────┴────────────────────────┘          │
│                                  │                                   │
│                          ┌───────▼───────┐                           │
│                          │  PostgreSQL    │                           │
│                          │  (Drizzle)    │                           │
│                          └───────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
         ▲                          ▲
         │ fetch (cookies)          │ fetch (JWT/cookies)
    ┌────┴─────┐              ┌────┴─────────┐
    │ Web UI   │              │ Mobile App   │
    │ (React)  │              │ (React Native)│
    └──────────┘              └──────────────┘
```

## User Roles

Three roles defined in `packages/shared/src/schema/enums.ts`:

| Role | Description |
|---|---|
| `admin` | Full access — manage users, projects, settings |
| `operator` | Manage equipment, view maps, field operations |
| `technician` | Create, View, and update maps, markers, field data |

Role is set during signup (step 1) and stored in the `users.role` column.

## Sign-Up Flow

Both web and mobile use a 3-step signup:

### Step 1: Role Selection
User picks Admin, Operator, or Technician. Each option shows an icon and description.

### Step 2: Credentials
- Name, email, password, confirm password
- Validated with shared Zod schema (`signupSchema` from `@sitemap/shared/auth`)
- Password requires minimum 8 characters

### Step 3: Two-Factor Authentication Setup
Account is created via `POST /api/auth/sign-up/email` before 2FA setup begins.

**Passkey (promoted if supported):**
- Web: checks `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`
- Mobile: checks `Passkey.isSupported()` (iOS 16+, Android API 28+)
- If supported, shown as the primary option with a prominent card
- Calls the WebAuthn registration flow (see below)

**TOTP Authenticator App (always available):**
- Calls `POST /api/auth/two-factor/enable` with password
- Returns `totpURI` containing the secret
- User enters 6-digit code from their authenticator app
- Verified via `POST /api/auth/two-factor/verify-totp`

"Skip for now" link available but de-emphasized.

## Sign-In Flow

### Email + Password
1. User enters email and password
2. Client calls `POST /api/auth/sign-in/email`
3. If 2FA is enabled, returns error code `TWO_FACTOR_REQUIRED`
4. User enters TOTP code, verified via `POST /api/auth/two-factor/verify-totp`
5. Session created, user redirected to dashboard

### Passkey
1. Button only shown if passkeys are supported on the device/browser
2. Calls WebAuthn authentication flow (see below)
3. Returns a short-lived JWT `passkeyToken`
4. Token can be exchanged for a session

## WebAuthn / Passkey Implementation

Custom implementation using `@simplewebauthn/server` and `@simplewebauthn/browser`. Does **not** use a better-auth plugin (none available in v1.5.6).

### Why Custom?
better-auth v1.5.6 doesn't include a passkey plugin. We implement WebAuthn directly using the same pattern as the fajr-medflow-emr app: SimpleWebAuthn libraries with signed JWT challenge tokens.

### Challenge Token Strategy
Instead of httpOnly cookies (which don't work cross-origin for mobile), all challenge data is packed into a signed JWT:

```
challengeToken = JWT.sign({ challenge, userId, email }, JWT_SECRET, { expiresIn: '5m' })
```

This token is returned alongside the WebAuthn options and must be sent back during verification. Both web and mobile use the same token-based flow.

### Registration Flow

```
Client                                  Server
  │                                       │
  │  POST /register/options               │
  │  { email, userId? }                   │
  │ ────────────────────────────────────→  │
  │                                       │  Generate registration options
  │                                       │  Sign challenge into JWT
  │  { options, challengeToken }          │
  │ ←────────────────────────────────────  │
  │                                       │
  │  Browser/OS WebAuthn prompt           │
  │  (Face ID, Touch ID, Windows Hello)   │
  │                                       │
  │  POST /register/verify                │
  │  { credential, challengeToken,        │
  │    deviceName }                       │
  │ ────────────────────────────────────→  │
  │                                       │  Verify registration response
  │                                       │  Store in passkey_credentials
  │  { verified: true }                   │  (or return pendingCredential
  │ ←────────────────────────────────────  │   for signup flow)
```

**Signup flow note:** If the user doesn't exist yet (during signup), the server returns `pendingCredential` data instead of storing it. The credential is stored after account creation.

### Authentication Flow

```
Client                                  Server
  │                                       │
  │  POST /authenticate/options           │
  │  { email? }                           │
  │ ────────────────────────────────────→  │
  │                                       │  If email: targeted mode
  │                                       │  If no email: discoverable mode
  │  { options, challengeToken }          │
  │ ←────────────────────────────────────  │
  │                                       │
  │  Browser/OS WebAuthn prompt           │
  │                                       │
  │  POST /authenticate/verify            │
  │  { credential, challengeToken }       │
  │ ────────────────────────────────────→  │
  │                                       │  Verify authentication response
  │                                       │  Update counter (replay prevention)
  │  { verified, passkeyToken, user }     │  Create short-lived JWT
  │ ←────────────────────────────────────  │
```

**Targeted vs Discoverable:**
- **Targeted** (email provided): Server looks up user's passkeys, sends `allowCredentials` list
- **Discoverable** (no email): Empty `allowCredentials`, browser/OS shows all passkeys for this site

### Security Features

- **Signature counter**: Updated on each authentication to detect cloned authenticators
- **Challenge-response**: One-time use challenges prevent replay attacks
- **Origin verification**: Validates web origin, supports Android APK hash
- **User verification required**: Biometric/PIN always required
- **JWT expiry**: Challenge tokens expire in 5 minutes
- **Platform authenticators**: Only platform authenticators (Face ID, Touch ID, Windows Hello) — no USB keys

### Mobile-Specific Considerations

- Uses `react-native-passkey` (v3.x API with `Passkey.create()` / `Passkey.get()`)
- Android development requires replacing `localhost` with `10.0.2.2` in the base URL
- iCloud Keychain retry: If `excludeCredentials` causes a native error (synced passkey conflict), retries without them
- iOS requires Associated Domains configuration for passkeys to work
- Android requires Digital Asset Links (`assetlinks.json`) on the web domain

## Database Tables

### users
Core user table shared with better-auth:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, auto-generated |
| email | text | Unique |
| name | text | |
| role | text | admin, operator, technician |
| email_verified | boolean | Default false |
| image | text | Nullable |
| is_active | boolean | Default true |
| two_factor_enabled | boolean | Default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### sessions
better-auth session tracking:

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| user_id | uuid | FK → users, cascade delete |
| token | text | Unique, indexed |
| expires_at | timestamptz | |
| ip_address | text | Nullable |
| user_agent | text | Nullable |

### two_factors
TOTP secrets for 2FA:

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| user_id | uuid | FK → users, cascade delete |
| secret | text | Encrypted TOTP secret |
| backup_codes | text | JSON array of one-time codes |
| enabled | boolean | Default false |

### passkey_credentials
WebAuthn credential storage:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, auto-generated |
| user_id | uuid | FK → users, cascade delete |
| credential_id | text | Unique, base64url encoded |
| public_key | text | base64url encoded |
| counter | bigint | Signature counter for replay prevention |
| device_type | text | singleDevice or multiDevice |
| backed_up | boolean | Whether synced (iCloud/Google) |
| transports | text | JSON array of transport types |
| device_name | text | User-friendly name |
| is_active | boolean | Default true (soft delete) |
| last_used_at | timestamptz | Updated on each authentication |
| created_at | timestamptz | |

Indexed on `(user_id, is_active)` for efficient credential lookups.

## Route Handling

All `/api/auth/*` routes are intercepted before TanStack Start's SSR handler:

| Route | Handler | Method |
|---|---|---|
| `/api/auth/mobile-token` | `mobile-auth.ts` | POST |
| `/api/auth/refresh-token` | `mobile-auth.ts` | POST |
| `/api/auth/webauthn/register/options` | `webauthn.ts` | POST |
| `/api/auth/webauthn/register/verify` | `webauthn.ts` | POST |
| `/api/auth/webauthn/authenticate/options` | `webauthn.ts` | POST |
| `/api/auth/webauthn/authenticate/verify` | `webauthn.ts` | POST |
| `/api/auth/*` (everything else) | `auth-handler.ts` → better-auth | GET/POST |

This routing is configured in two places:
- **Dev**: `authMiddleware()` Vite plugin in `apps/web/vite.config.ts`
- **Prod**: `Bun.serve()` handler in `apps/web/server.ts`

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `dev-secret-change-me` | Signs challenge tokens and mobile auth tokens |
| `WEBAUTHN_RP_ID` | No | `localhost` | WebAuthn Relying Party ID (your domain) |
| `WEBAUTHN_RP_NAME` | No | `SiteMap` | Display name in passkey prompts |
| `WEBAUTHN_ORIGIN` | No | `http://localhost:3000` | Expected origin for WebAuthn verification |
| `WEBAUTHN_ANDROID_ORIGIN` | No | — | Android APK key hash origin for passkeys |
| `PROD_API_URL` | No | `https://sitemap.yourdomain.com` | Production URL for trusted origins |

## Web Route Protection

TanStack Router layout-based auth:

- **`_auth.tsx`** layout (login/signup pages): Redirects to `/dashboard` if already logged in
- **`_app.tsx`** layout (dashboard, projects, etc.): Redirects to `/login` if not authenticated. Checks `authClient.getSession()` in `beforeLoad`.

## Mobile Auth Gating

`MainNavigator.tsx` conditionally renders:
- **Loading**: `ActivityIndicator` while `isLoading` (checking stored session)
- **Unauthenticated**: `LoginScreen` / `SignupScreen` (toggle via state)
- **Authenticated**: Full app with `HomeTabs` stack navigator

Session is auto-restored on app launch via `AuthContext.useEffect` → `authService.getSession()`.

## Shared Validation

Both web and mobile import from `@sitemap/shared/auth`:

```ts
import { loginSchema, signupSchema, USER_ROLE_OPTIONS } from '@sitemap/shared/auth'
```

- `loginSchema` — email (valid format) + password (min 8 chars)
- `signupSchema` — name + email + password + confirmPassword (must match) + role
- `USER_ROLE_OPTIONS` — array of `{ value, label, description, icon }` for UI rendering
