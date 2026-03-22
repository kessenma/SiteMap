import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  MapPin, Shield, Settings, Wrench, Eye, EyeOff,
  Fingerprint, Loader2, ArrowLeft, ArrowRight, Check,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { usePasskey } from '#/hooks/usePasskey'
import { signupSchema, USER_ROLE_OPTIONS } from '@sitemap/shared/auth'
import type { UserRole } from '@sitemap/shared/schema'

export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
})

const ROLE_ICONS = { Shield, Settings, Wrench } as const

function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Step 0: Role
  const [role, setRole] = useState<UserRole | ''>('')

  // Step 1: Credentials
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2: 2FA
  const [totpUri, setTotpUri] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [passkeyRegistered, setPasskeyRegistered] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const { isSupported: passkeySupported, register: registerPasskey } = usePasskey()

  const handleNextFromRole = () => {
    if (!role) {
      setError('Please select a role')
      return
    }
    setError('')
    setStep(1)
  }

  const handleNextFromCredentials = () => {
    setError('')
    const result = signupSchema.safeParse({ firstName, lastName, email, password, confirmPassword, role })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }
    setStep(2)
  }

  const createAccount = async () => {
    if (accountCreated) return true
    setIsLoading(true)
    setError('')
    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        role: role as UserRole,
      } as any)
      if (res.error) {
        setError(res.error.message || 'Failed to create account')
        return false
      }
      setAccountCreated(true)
      return true
    } catch {
      setError('Something went wrong. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableTotp = async () => {
    // First create the account if not already
    const created = await createAccount()
    if (!created) return

    setIsLoading(true)
    setError('')
    try {
      const res = await authClient.twoFactor.enable({ password })
      if (res.error) {
        setError(res.error.message || 'Failed to enable 2FA')
      } else if (res.data) {
        setTotpUri(res.data.totpURI)
        // Extract secret from the TOTP URI (otpauth://totp/...?secret=XXXX&...)
        const secretMatch = res.data.totpURI.match(/secret=([^&]+)/)
        if (secretMatch) setTotpSecret(secretMatch[1])
      }
    } catch {
      setError('Failed to set up 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyTotp = async () => {
    if (totpCode.length !== 6) return
    setIsLoading(true)
    setError('')
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: totpCode })
      if (res.error) {
        setError(res.error.message || 'Invalid code')
      } else {
        setTwoFAEnabled(true)
      }
    } catch {
      setError('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterPasskey = async () => {
    // Create account first if needed
    const created = await createAccount()
    if (!created) return

    setIsLoading(true)
    setError('')
    try {
      const result = await registerPasskey(email)
      if (result.verified) {
        setPasskeyRegistered(true)
      }
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        setError(err.message || 'Passkey registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipOrFinish = async () => {
    // If account hasn't been created yet (skipping 2FA entirely), create it now
    if (!accountCreated) {
      const created = await createAccount()
      if (!created) return
    }
    navigate({ to: '/dashboard' })
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/60' : 'w-2 bg-muted'
          }`}
        />
      ))}
    </div>
  )

  // Step 0: Role Selection
  if (step === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          {stepIndicator}
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>What's your role?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {USER_ROLE_OPTIONS.map((option) => {
              const Icon = ROLE_ICONS[option.icon as keyof typeof ROLE_ICONS]
              const isSelected = role === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { setRole(option.value); setError('') }}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button className="w-full" onClick={handleNextFromRole} disabled={!role}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Step 1: Credentials
  if (step === 1) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {stepIndicator}
          <CardTitle className="text-xl">Your Details</CardTitle>
          <CardDescription>Enter your name, email, and choose a password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNextFromCredentials() }}
            className="flex flex-col gap-4"
          >
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Step 2: 2FA Setup
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {stepIndicator}
        <CardTitle className="text-xl">Secure Your Account</CardTitle>
        <CardDescription>
          Set up two-factor authentication for extra security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Passkey option - promoted if supported */}
          {passkeySupported && !passkeyRegistered && (
            <button
              type="button"
              onClick={handleRegisterPasskey}
              disabled={isLoading}
              className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">{isLoading ? 'Setting up...' : 'Set up Passkey'}</p>
                <p className="text-xs text-muted-foreground">
                  Use Face ID, Touch ID, or Windows Hello for quick and secure sign-in
                </p>
              </div>
            </button>
          )}

          {passkeyRegistered && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">Passkey registered</p>
            </div>
          )}

          {/* TOTP option */}
          {!totpUri && !twoFAEnabled && (
            <button
              type="button"
              onClick={handleEnableTotp}
              disabled={isLoading}
              className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isLoading ? 'Setting up...' : 'Use Authenticator App'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Use Google Authenticator, Authy, or similar app
                </p>
              </div>
            </button>
          )}

          {/* TOTP setup form */}
          {totpUri && !twoFAEnabled && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Set up your authenticator app</p>
              <p className="text-xs text-muted-foreground">
                Add this key to your authenticator app, then enter the 6-digit code to verify.
              </p>
              <div className="rounded-md bg-muted p-3">
                <p className="break-all font-mono text-xs select-all">{totpSecret}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="totp-verify">Verification Code</Label>
                <Input
                  id="totp-verify"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center tracking-widest"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleVerifyTotp}
                disabled={isLoading || totpCode.length !== 6}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </div>
          )}

          {twoFAEnabled && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">Two-factor authentication enabled</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button className="flex-1" onClick={handleSkipOrFinish} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {twoFAEnabled || passkeyRegistered ? 'Finish' : 'Skip for now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
