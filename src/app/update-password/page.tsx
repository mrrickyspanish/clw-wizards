'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'

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
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [canReset, setCanReset] = useState(false)

  useEffect(() => {
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
    })

    return () => {
      active = false
    }
  }, [searchParams])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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

    setLoading(true)
    const supabase = createBrowserSupabase()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await supabase.auth.signOut({ scope: 'local' })
    router.replace('/login?reset=success')
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
