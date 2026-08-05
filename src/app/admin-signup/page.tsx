'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createAdminAccount } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthBrand } from '@/components/layout/AuthBrand'
import { ORG } from '@/config/org.config'
import type { AppRole } from '@/types/database'

type PendingRole = Exclude<AppRole, 'admin'>

const ROLE_LABEL: Record<PendingRole, string> = {
  parent: 'parent',
  staff: 'staff',
}

export default function AdminSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Set when the email already has a non-admin account and the password checked
  // out. Nothing has changed on that account yet — this is the confirmation.
  const [pendingRole, setPendingRole] = useState<PendingRole | null>(null)

  async function submit(confirmUpgrade: boolean) {
    setError(null)
    setLoading(true)

    const result = await createAdminAccount({ fullName, email, password, code, confirmUpgrade })
    setLoading(false)

    if (result.status === 'error') {
      setPendingRole(null)
      setError(result.message)
      return
    }
    if (result.status === 'needs-upgrade-confirm') {
      setPendingRole(result.currentRole)
      return
    }
    // The account is created (or converted) + confirmed server-side; finish at
    // the normal login, which carries the captcha and the role-based redirect.
    router.push(confirmUpgrade ? '/login?created=admin-upgrade' : '/login?created=admin')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void submit(false)
  }

  if (pendingRole) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-clw-black px-4 py-12">
        <AuthBrand />
        <Card className="w-full max-w-md border-clw-gold/20 bg-clw-black-2">
          <CardHeader>
            <CardTitle className="text-clw-gold">Switch this account to admin?</CardTitle>
            <CardDescription>
              {email} already has a {ROLE_LABEL[pendingRole]} account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-base text-clw-gray">
              We can switch that same account over instead of making you start again. You keep the email and password
              you already use, and any family or athlete records stay attached to it.
            </p>
            <p className="text-base text-clw-gray">
              After the switch you&apos;ll land on the admin dashboard rather than the parent portal. A full admin can
              change your access level later.
            </p>
            <Button type="button" className="w-full" disabled={loading} onClick={() => void submit(true)}>
              {loading ? 'Switching account…' : 'Yes, switch to admin'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setPendingRole(null)
                setError(null)
              }}
            >
              Use a different email
            </Button>
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
          <CardTitle className="text-clw-gold">Create a {ORG.shortName} admin account</CardTitle>
          <CardDescription>
            For club staff and organizers. You need an admin access code — ask a current full admin, or use the
            club&apos;s setup code.
          </CardDescription>
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
              <p className="text-sm text-muted-foreground">
                Already signed up as a parent by mistake? Use that same email and its current password — we&apos;ll
                offer to switch the account over.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Admin access code</Label>
              <Input
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="e.g. ABCD-2345"
              />
              <p className="text-sm text-muted-foreground">
                Your access level (full or limited) is set by this code — you don&apos;t choose it here.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create admin account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="hover:underline">
                Sign in
              </Link>
            </div>
          </form>

          <div className="mt-6 border-t border-clw-gold/15 pt-5">
            <p className="text-center text-base text-muted-foreground">
              Here as a wrestler&apos;s parent or guardian? You want the family signup.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/signup">Create a parent account instead</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
