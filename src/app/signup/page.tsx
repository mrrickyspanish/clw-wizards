'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { useTurnstile } from '@/components/auth/useTurnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { ORG } from '@/config/org.config'
import { authAttempt } from '@/lib/auth/report-client'

function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))
  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const turnstile = useTurnstile()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (turnstile.enabled && !turnstile.token) {
      setError('Complete the security check before creating your account.')
      return
    }

    setLoading(true)
    authAttempt(email.trim())

    // Deliberately NOT supabase.auth.signUp(). That sends the confirmation
    // through Supabase's built-in sender, which has a low project-wide hourly
    // cap and silently stops sending past it -- while still reporting success,
    // so the parent is told to check an inbox nothing was sent to. Our own
    // route generates the same link and sends it through Resend, the provider
    // that already carries password resets and every other club email.
    let response: Response
    try {
      response = await fetch('/api/auth/request-signup-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName,
          redirectTo,
          ...(turnstile.token ? { turnstileToken: turnstile.token } : {}),
        }),
      })
    } catch {
      setError('Could not reach the site. Check your connection and try again.')
      turnstile.reset()
      setLoading(false)
      return
    }

    const raw = await response.text().catch(() => '')
    let data: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>
    } catch {
      console.error('[signup] non-JSON response', { status: response.status, bodyStart: raw.slice(0, 200) })
    }

    if (!response.ok) {
      setError(typeof data.error === 'string' && data.error
        ? data.error
        : 'We could not finish creating your account. Please try again in a moment.')
      turnstile.reset()
      setLoading(false)
      return
    }

    // handle_new_user() creates the profiles row server-side. Contact info and
    // the athlete roster are collected afterward in /onboarding.
    setLoading(false)
    setNeedsConfirmation(true)
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
        <AuthBrand />
        <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
          <CardHeader>
            <CardTitle className="text-clw-gold">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email}. Open it to continue to family setup. If it opens in a different browser, sign in with the email and password you just chose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={loginHref} className="text-sm hover:underline">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
      <AuthBrand />
      <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
        <CardHeader>
          <CardTitle className="text-clw-gold">Create your {ORG.shortName} account</CardTitle>
          <CardDescription>For parents and guardians of {ORG.name} wrestlers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {redirectTo === '/registration' && !error && (
              <Alert className="border-clw-gold/30 bg-clw-gold/5">
                <AlertDescription className="text-clw-gray">
                  Create your family account, then you will continue to season registration.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {turnstile.widget}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (turnstile.enabled && !turnstile.token)}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href={loginHref} className="hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
