'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { homeForRole } from '@/lib/auth/session'
import { signInErrorMessage } from '@/lib/auth/recovery-errors'
import { useTurnstile } from '@/components/auth/useTurnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { ORG } from '@/config/org.config'
import { signupDestination } from '@/lib/auth/signup-routing'
import { authAttempt, markAuthNavigation, reportClientAuthFailure } from '@/lib/auth/report-client'

function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Set when sign-in fails only because the address was never confirmed. Holds
  // the address so a fresh confirmation link can be sent to exactly it.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)
  const turnstile = useTurnstile()
  const redirectTo = safeRedirect(searchParams.get('redirectTo'))
  const signupHref = redirectTo ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/signup'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setUnconfirmedEmail(null)

    if (turnstile.enabled && !turnstile.token) {
      setError('Complete the security check before signing in.')
      return
    }

    setLoading(true)
    authAttempt(email.trim())
    let authenticated = false

    try {
      const supabase = createBrowserSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: turnstile.token ? { captchaToken: turnstile.token } : {},
      })

      if (signInError) {
        // Confirmation links expire. A parent who opens theirs too late lands
        // here with a correct password and an unconfirmed address, and until
        // now the only advice on offer was to open the newest confirmation
        // email -- which is the expired one. Offer a fresh link instead of
        // the provider's bare "Email not confirmed".
        if (signInError.code === 'email_not_confirmed') {
          setUnconfirmedEmail(email.trim())
          setResendState('idle')
          setResendError(null)
        } else {
          setError(signInErrorMessage(signInError))
        }
        turnstile.reset()
        return
      }
      authenticated = true
      markAuthNavigation()

      if (redirectTo) {
        router.push(redirectTo)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        void reportClientAuthFailure('family_setup', profileError ?? { code: 'profile_missing', message: 'Authenticated user has no profile' }, email)
        setError('We could not open your family account. Please try signing in again or contact the club.')
        return
      }

      router.push(homeForRole(profile?.role ?? null))
    } catch (error) {
      if (authenticated) void reportClientAuthFailure('family_setup', error, email)
      setError(signInErrorMessage(error))
      turnstile.reset()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!unconfirmedEmail) return
    if (turnstile.enabled && !turnstile.token) {
      setResendError('Complete the security check below, then ask for a new link.')
      return
    }
    setResendState('sending')
    setResendError(null)
    try {
      const supabase = createBrowserSupabase()
      const { error: resendFailure } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
        options: {
          // Same landing as the original signup email, so the fresh link
          // continues into family setup exactly as the first one would have.
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(signupDestination(redirectTo))}`,
          ...(turnstile.token ? { captchaToken: turnstile.token } : {}),
        },
      })
      if (resendFailure) {
        setResendState('idle')
        // The provider's own wording never reaches the screen.
        setResendError(resendFailure.code === 'over_email_send_rate_limit'
          ? 'A new link was sent moments ago. Check your inbox and spam folder, or wait a minute before asking again.'
          : `We could not send a new link right now. Wait a minute and try again, or contact the club at ${ORG.contactEmail}.`)
      } else {
        setResendState('sent')
      }
    } catch {
      setResendState('idle')
      setResendError('Could not reach the server. Check your connection and try again.')
    } finally {
      // Security-check tokens are single use; the next attempt needs a new one.
      turnstile.reset()
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
      <AuthBrand />
      <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
        <CardHeader>
          <CardTitle className="text-clw-gold">{ORG.shortName} Sign In</CardTitle>
          <CardDescription>Sign in to your parent portal or staff dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {searchParams.has('confirmation') && !error && !unconfirmedEmail && (
              <Alert className="border-clw-gold/40 bg-clw-gold/10">
                <AlertDescription className="text-base">
                  {searchParams.get('confirmation') === 'complete'
                    ? 'Email confirmed. Sign in with the password you chose to continue to family setup.'
                    : 'If the link did not open or has expired, sign in below with the email and password you chose. If your email still needs confirming, we will send you a fresh link.'}
                </AlertDescription>
              </Alert>
            )}
            {unconfirmedEmail && (
              <div role="alert" className="space-y-3 rounded-md border border-clw-gold/40 bg-clw-gold/10 p-4">
                <p className="text-base font-medium text-clw-gold-ink">Your email is not confirmed yet</p>
                {resendState === 'sent' ? (
                  <p className="text-base text-clw-white">
                    We sent a new confirmation link to {unconfirmedEmail}. Open the newest email from us
                    (check spam too), then come back here and sign in. The link only works for a limited
                    time, so use it soon.
                  </p>
                ) : (
                  <>
                    <p className="text-base text-clw-white">
                      Confirmation links only work for a limited time, so an older email may no longer open.
                      We can send a fresh one to {unconfirmedEmail}.
                    </p>
                    {resendError && <p className="text-base text-red-400">{resendError}</p>}
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleResend}
                      disabled={resendState === 'sending' || (turnstile.enabled && !turnstile.token)}
                    >
                      {resendState === 'sending' ? 'Sending…' : 'Email me a new confirmation link'}
                    </Button>
                  </>
                )}
              </div>
            )}
            {searchParams.get('created') === 'admin' && !error && (
              <Alert className="border-clw-gold/40 bg-clw-gold/10">
                <AlertDescription className="text-clw-gold-ink">
                  Admin account created. Sign in to open your dashboard.
                </AlertDescription>
              </Alert>
            )}
            {redirectTo === '/registration' && !error && (
              <Alert className="border-clw-gold/30 bg-clw-gold/5">
                <AlertDescription className="text-clw-gray">
                  Sign in to continue to season registration.
                </AlertDescription>
              </Alert>
            )}
            {searchParams.get('reset') === 'success' && !error && (
              <Alert className="border-clw-gold/40 bg-clw-gold/10">
                <AlertDescription className="text-clw-gold-ink">
                  Password updated. Sign in with your new password.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {turnstile.widget}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || (turnstile.enabled && !turnstile.token)}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
            <div className="flex justify-between text-sm text-muted-foreground">
              <Link href="/forgot-password" className="hover:underline">
                Forgot password?
              </Link>
              <Link href={signupHref} className="hover:underline">
                Create account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
