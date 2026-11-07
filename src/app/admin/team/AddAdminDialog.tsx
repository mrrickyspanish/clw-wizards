'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

import type { AdminScope } from '@/types/database'
import { inviteAdminByEmail } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const LEVELS: { scope: AdminScope; label: string; detail: string }[] = [
  { scope: 'limited', label: 'Limited access', detail: 'Everything except editing the public website.' },
  { scope: 'full', label: 'Full access', detail: 'Also edits the public website and manages admins.' },
]

// Admin team: Add admin (Tyler, Nov 7). Same as Add parent login: the site
// makes the login and emails a link to set a password. No invite codes.
export function AddAdminDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailAgain, setEmailAgain] = useState('')
  const [scope, setScope] = useState<AdminScope>('limited')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  // On a phone the answer can sit below the fold of the dialog: bring it up.
  const answerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) answerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName('')
      setEmail('')
      setEmailAgain('')
      setScope('limited')
      setError(null)
      setDone(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (email.trim().toLowerCase() !== emailAgain.trim().toLowerCase()) {
      setError("The two emails don't match.")
      return
    }
    setLoading(true)
    const result = await inviteAdminByEmail({ name, email, emailAgain, scope })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const trimmed = email.trim().toLowerCase()
    setDone(
      result.emailed
        ? `Done. We emailed ${trimmed} a link to set a password. Then they log in and land on the admin pages.`
        : `Login made, but the email didn't go out. Ask them to go to the login page, tap Set or reset password and enter ${trimmed}.`
    )
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full text-base sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" /> Add admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Add admin</DialogTitle>
          <DialogDescription className="text-base">
            We email them a link to set a password. Someone with a family login uses a second email here, so their
            family login stays as it is.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <p className="text-base text-clw-white">{done}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_admin_name">Their name</Label>
              <Input
                id="invite_admin_name"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite_admin_email">Their email</Label>
              <Input
                id="invite_admin_email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite_admin_email_again">Their email again</Label>
              <Input
                id="invite_admin_email_again"
                type="email"
                required
                maxLength={254}
                value={emailAgain}
                onChange={(e) => setEmailAgain(e.target.value)}
                autoComplete="off"
              />
              <p className="text-sm text-clw-gray">
                Check it twice: whoever gets the email can see every family&apos;s records.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-base font-medium text-clw-white">Access</legend>
              {LEVELS.map((level) => (
                <label
                  key={level.scope}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    scope === level.scope ? 'border-clw-gold/50 bg-clw-gold/10' : 'border-clw-gold/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="invite_admin_scope"
                    value={level.scope}
                    checked={scope === level.scope}
                    onChange={() => setScope(level.scope)}
                    className="mt-1 h-4 w-4 accent-clw-gold"
                  />
                  <span>
                    <span className="block text-base text-clw-white">{level.label}</span>
                    <span className="block text-sm text-clw-gray">{level.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div ref={answerRef} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding…' : 'Add admin'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
