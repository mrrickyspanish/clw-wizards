'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

import { addParentLoginAsAdmin } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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

const listNames = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '')

// On a wrestler in Families: give another parent their own login for this
// wrestler (and any siblings ticked).
export function AddParentLoginDialog({
  ownerId,
  ownerName,
  athleteId,
  wrestlers,
}: {
  ownerId: string
  // Whose account the wrestlers stay on, for the explanation.
  ownerName: string
  athleteId: string
  // The family's active wrestlers, to cover siblings in one go.
  wrestlers: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailAgain, setEmailAgain] = useState('')
  // Set when the email already has a login: whose, waiting for a yes.
  const [existingName, setExistingName] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([athleteId])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  // On a phone the answer can sit below the fold of the dialog: bring it up.
  const answerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error || existingName) answerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error, existingName])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName('')
      setEmail('')
      setEmailAgain('')
      setExistingName(null)
      setPicked([athleteId])
      setError(null)
      setDone(null)
    }
  }

  const emailsMatch = email.trim().toLowerCase() === emailAgain.trim().toLowerCase()

  async function submit(linkExisting: boolean) {
    setError(null)
    if (!emailsMatch) {
      setError("The two emails don't match.")
      return
    }
    setLoading(true)
    const result = await addParentLoginAsAdmin(ownerId, { name, email, emailAgain, athleteIds: picked, linkExisting })
    setLoading(false)
    if (!result.ok) {
      if (result.existingName) setExistingName(result.existingName)
      else setError(result.error)
      return
    }
    const kids = listNames(result.wrestlers)
    const trimmed = email.trim().toLowerCase()
    setDone(
      result.outcome === 'linked'
        ? `They already had a login, so no email was sent. They now see ${kids} when they log in.`
        : result.emailed
          ? `Done. We emailed ${trimmed} a link to set a password. Then they log in and see ${kids}.`
          : `Login made for ${kids}, but the email didn't go out. Ask them to go to the login page, tap Set or reset password and enter ${trimmed}.`
    )
    router.refresh()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit(false)
  }

  const siblings = wrestlers.length > 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
          <UserPlus className="mr-1.5 h-4 w-4" /> Add parent login
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Add parent login</DialogTitle>
          <DialogDescription className="text-base">
            Their own login: they can see the wrestler, pay dues, upload documents and sign forms. Registration and
            wrestler details stay with {ownerName}&apos;s account.
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
              <Label htmlFor={`login_name_${athleteId}`}>Their name</Label>
              <Input
                id={`login_name_${athleteId}`}
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`login_email_${athleteId}`}>Their email</Label>
              <Input
                id={`login_email_${athleteId}`}
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setExistingName(null)
                }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`login_email_again_${athleteId}`}>Their email again</Label>
              <Input
                id={`login_email_again_${athleteId}`}
                type="email"
                required
                maxLength={254}
                value={emailAgain}
                onChange={(e) => {
                  setEmailAgain(e.target.value)
                  setExistingName(null)
                }}
                autoComplete="off"
              />
              <p className="text-sm text-clw-gray">
                We email them a link to set their password, so check it twice: whoever gets it sees the wrestler&apos;s
                records.
              </p>
            </div>

            {siblings && (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-base font-medium text-clw-white">Wrestlers they see</legend>
                {wrestlers.map((w) => (
                  <label key={w.id} className="flex min-h-11 items-center gap-3 text-base text-clw-white">
                    <Checkbox
                      checked={picked.includes(w.id)}
                      onCheckedChange={(checked) =>
                        setPicked((now) => (checked === true ? [...now, w.id] : now.filter((id) => id !== w.id)))
                      }
                    />
                    {w.name}
                  </label>
                ))}
              </fieldset>
            )}

            <div ref={answerRef} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {existingName ? (
                <div className="space-y-3 rounded-md border border-clw-gold/30 bg-clw-gold/5 p-4">
                  <p className="text-base text-clw-white">
                    {email.trim().toLowerCase()} already has a login:{' '}
                    <span className="font-medium">{existingName}</span>. Link that login to the wrestlers ticked? No
                    email is sent.
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" disabled={loading} onClick={() => setExistingName(null)}>
                      Cancel
                    </Button>
                    <Button type="button" disabled={loading} onClick={() => void submit(true)}>
                      {loading ? 'Linking…' : 'Link it'}
                    </Button>
                  </div>
                </div>
              ) : (
                <DialogFooter>
                  <Button type="submit" disabled={loading || picked.length === 0}>
                    {loading ? 'Setting up…' : 'Add login'}
                  </Button>
                </DialogFooter>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
