'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { ORG } from '@/config/org.config'

declare global {
  interface Window {
    clwTurnstileSuccess?: (token: string) => void
    clwTurnstileExpired?: () => void
    turnstile?: { reset: () => void }
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.clwTurnstileSuccess = (token: string) => {
      setCaptchaToken(token)
      setError(null)
    }
    window.clwTurnstileExpired = () => setCaptchaToken(null)

    return () => {
      delete window.clwTurnstileSuccess
      delete window.clwTurnstileExpired
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Complete the security check before creating your account.')
      return
    }

    setLoading(true)

    const supabase = createBrowserSupabase()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        ...(captchaToken ? { captchaToken } : {}),
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setCaptchaToken(null)
      window.turnstile?.reset()
      setLoading(false)
      return
    }

    // handle_new_user() creates the profiles row server-side. Contact info
    // and the athlete roster are collected afterward in /onboarding, never
    // here, since signUp() may not return a session yet (email confirmation
    // required) and there'd be nowhere authenticated for that data to land.
    if (data.session) {
      setLoading(false)
      router.push('/dashboard')
      return
    }

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
              We sent a confirmation link to {email}. Once confirmed, sign in to finish setting up your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-sm hover:underline">
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

            {TURNSTILE_SITE_KEY ? (
              <div>
                <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
                <div
                  className="cf-turnstile"
                  data-sitekey={TURNSTILE_SITE_KEY}
                  data-theme="dark"
                  data-size="flexible"
                  data-callback="clwTurnstileSuccess"
                  data-expired-callback="clwTurnstileExpired"
                  data-error-callback="clwTurnstileExpired"
                />
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || Boolean(TURNSTILE_SITE_KEY && !captchaToken)}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
