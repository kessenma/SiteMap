import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { MapPin, Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { usePasskey } from '#/hooks/usePasskey'
import { loginSchema } from '@sitemap/shared/auth'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    setIsLoading(true)
    try {
      const res = await authClient.signIn.email({ email, password })
      if (res.error) {
        if (res.error.code === 'TWO_FACTOR_REQUIRED') {
          setNeeds2FA(true)
        } else {
          setError(res.error.message || 'Invalid email or password')
        }
      } else {
        navigate({ to: '/dashboard' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length !== 6) return
    setError('')
    setTwoFALoading(true)
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: totpCode })
      if (res.error) {
        setError(res.error.message || 'Invalid code')
      } else {
        navigate({ to: '/dashboard' })
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const { authenticate: passkeyAuthenticate, isSupported: passkeySupported } = usePasskey()

  const handlePasskeyLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      const result = await passkeyAuthenticate(email || undefined)
      if (result.verified) {
        // Passkey auth successful — create a better-auth session using the passkey token
        // For now, sign in with the returned user info
        // TODO: Exchange passkey token for a better-auth session via a dedicated endpoint
        navigate({ to: '/dashboard' })
      }
    } catch (err: any) {
      setError(err.message || 'Passkey authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (needs2FA) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify2FA} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="totp">Verification Code</Label>
              <Input
                id="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={twoFALoading || totpCode.length !== 6}>
              {twoFALoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setNeeds2FA(false)
                setTotpCode('')
                setError('')
              }}
            >
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access SiteMap</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
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
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          {passkeySupported && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handlePasskeyLogin}
              disabled={isLoading}
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              Sign in with Passkey
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
