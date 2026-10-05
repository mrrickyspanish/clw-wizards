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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}

/**
 * The email field is prefilled from ?email= when the signup form sent the
 * parent here after finding they already had an account.
 *
 * Not a convenience. This route answers a neutral success for an address that
 * has no account -- deliberately, so it cannot be used to discover who is
 * registered. The cost is that a typo here looks exactly like a sent email: the
 * parent is told to check their inbox and waits for a message that was never
 * addressed to them. Carrying the address they already typed removes the one
 * keystroke that can put them back in the dead end they just escaped.
 */
function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const prefill = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(prefill.length <= 254 ? prefill : '')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const turnstile = useTurnstile()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (turnstile.enabled && !turnstile.token) {
      setError('Complete the security check before requesting a reset link.')
      return
    }

    setLoading(true)

    try {
      // Sent through our own API route, not supabase.auth.resetPasswordForEmail:
      // see api/auth/request-password-reset/route.ts for why.
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: turnstile.token }),
      })

      setLoading(false)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Something went wrong. Please try again.')
        turnstile.reset()
        return
      }

      setSent(true)
    } catch {
      setLoading(false)
      setError('Could not reach the server. Check your connection and try again.')
      turnstile.reset()
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
      <AuthBrand />
      <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
        <CardHeader>
          <CardTitle className="text-clw-gold">Set or reset your password</CardTitle>
          <CardDescription>
            First time signing in? If you registered with the club, your account is already set up. Enter that email and
            we&apos;ll send you a link to choose your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  If you have an account for {email}, check your inbox and spam folder for the link. It works once, so use the newest email. If nothing arrives within 10 minutes, contact the club at{' '}
                  <a href={`mailto:${ORG.contactEmail}`} className="underline">{ORG.contactEmail}</a>.
                </AlertDescription>
              </Alert>
              <div className="text-center text-sm">
                <p className="mb-3 text-muted-foreground">New to CLW? Create your family account instead.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              {turnstile.widget}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || (turnstile.enabled && !turnstile.token)}
              >
                {loading ? 'Sending…' : 'Email me a link'}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
