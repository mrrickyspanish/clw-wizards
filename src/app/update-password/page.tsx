'use client'

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { authAttempt, reportClientAuthFailure } from '@/lib/auth/report-client'

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  )
}

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'invalid-link'
      ? 'This password-reset link is invalid or has expired. Request a new link below.'
      : null
  )
  const [alreadyCurrent, setAlreadyCurrent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [canReset, setCanReset] = useState(false)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)
  const submitting = useRef(false)

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const token = fragment.get('recovery_token')
    authAttempt(undefined, fragment.get('attempt'))
    if (fragment.has('error')) {
      void reportClientAuthFailure('reset_link', {
        code: fragment.get('error_code') ?? fragment.get('error'),
        message: fragment.get('error_description') ?? 'Reset link rejected',
      })
    }
    if (token) {
      setRecoveryToken(token)
      setError(null)
      setCanReset(true)
      setCheckingLink(false)
      return
    }
    if (searchParams.get('error') === 'invalid-link') {
      setCheckingLink(false)
      return
    }

    const supabase = createBrowserSupabase()
    let active = true

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!active) return
      setCanReset(Boolean(data.user) && !userError)
      if (!data.user || userError) {
        setError('This password-reset link is invalid or has expired. Request a new link below.')
      }
      setCheckingLink(false)
    }).catch((failure: unknown) => {
      if (!active) return
      setCheckingLink(false)
      setError('Could not check your reset link. Check your connection and try again.')
      void reportClientAuthFailure('reset_link', failure)
    })

    return () => {
      active = false
    }
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting.current) return
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!canReset) {
      setError('Request a new password-reset link before choosing a password.')
      return
    }

    submitting.current = true
    setLoading(true)
    let failedStep: 'reset_link' | 'password_save' = recoveryToken ? 'reset_link' : 'password_save'
    try {
      const supabase = createBrowserSupabase()
      if (recoveryToken) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: recoveryToken, type: 'recovery' })
        if (verifyError) {
          void reportClientAuthFailure('reset_link', verifyError)
          if (verifyError.code === 'otp_expired') {
            setCanReset(false)
            setError('This reset link has already been used or has expired. Request a new link below, then use the newest email.')
          } else {
            setError('We could not verify the reset link right now. Please try again.')
          }
          return
        }
        setRecoveryToken(null)
        window.history.replaceState(null, '', '/update-password')
      }
      failedStep = 'password_save'
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        void reportClientAuthFailure('password_save', updateError)
        // Reaching this with same_password means the parent entered the password
        // they already have. Nothing is wrong with their account and nothing
        // needs resetting -- they are simply on the wrong page. Send them to
        // sign in rather than leaving the provider's "New password should be
        // different from the old password" sitting in a red box above a form
        // they have no reason to complete.
        if (updateError.code === 'same_password') {
          setAlreadyCurrent(true)
          return
        }
        setError(updateError.message)
        return
      }

      // The password is already saved. A local sign-out transport error must
      // not tell the parent (or the owner) that saving the password failed.
      try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* sign in below */ }
      router.replace('/login?reset=success')
    } catch (failure) {
      void reportClientAuthFailure(failedStep, failure)
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  if (alreadyCurrent) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
        <AuthBrand />
        <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
          <CardHeader>
            <CardTitle className="text-clw-gold">That is already your password</CardTitle>
            <CardDescription className="text-base">
              Nothing needs changing — the password you entered is the one already on your account.
              Sign in with it and carry on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" className="w-full" onClick={() => router.replace('/login')}>
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => { setAlreadyCurrent(false); setPassword(''); setConfirmPassword('') }}
              className="block w-full text-sm text-muted-foreground hover:underline"
            >
              Choose a different password instead
            </button>
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
          <CardTitle className="text-clw-gold">Set a new password</CardTitle>
          <CardDescription>Follow the link from your email to land here, then choose a new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {canReset && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
            {canReset ? (
              <Button type="submit" className="w-full" disabled={loading || checkingLink}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={() => router.replace('/forgot-password')} disabled={checkingLink}>
                {checkingLink ? 'Checking reset link…' : 'Request a new reset link'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
