'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ORG } from '@/config/org.config'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserSupabase()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // handle_new_user() creates the profiles row server-side. If email
    // confirmation is off, signUp() returns a live session immediately and we
    // can fill in the fields the trigger doesn't set (phone, SMS consent).
    if (data.session && data.user) {
      await supabase
        .from('profiles')
        .update({
          phone: phone || null,
          sms_opt_in: smsOptIn,
          sms_opt_in_at: smsOptIn ? new Date().toISOString() : null,
          consent_text: smsOptIn ? SMS_CONSENT_TEXT : null,
        })
        .eq('id', data.user.id)

      setLoading(false)
      router.push('/dashboard')
      return
    }

    setLoading(false)
    setNeedsConfirmation(true)
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clw-black px-4">
        <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
          <CardHeader>
            <CardTitle className="text-clw-gold">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email}. Once confirmed, sign in and add your phone number and SMS
              preferences from your dashboard.
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
    <div className="flex min-h-screen items-center justify-center bg-clw-black px-4 py-12">
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
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
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
            <div className="flex items-start gap-2">
              <Checkbox
                id="smsOptIn"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
              />
              <Label htmlFor="smsOptIn" className="text-xs font-normal leading-relaxed text-muted-foreground">
                {SMS_CONSENT_TEXT}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
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
