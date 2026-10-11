'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import type { BoardCopyRecipient } from '@/types/database'
import { addBoardRecipient, addPaymentNoticeRecipient, removeBoardRecipient, removePaymentNoticeRecipient } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const LISTS = {
  board: {
    intro:
      'These people get one email copy of every message sent to families, including the automatic reminders. The copy starts with who the message went to. Anyone who already received it as a parent is not sent a second one.',
    empty: 'Nobody is on the board copy list, so no copies are sent.',
    removed: 'will stop getting a copy of messages sent to families.',
    addLabel: 'Add to board copy',
    add: addBoardRecipient,
    remove: removeBoardRecipient,
  },
  payments: {
    intro:
      'These people get an email each time money moves through the website: dues, donations and sponsorships, plus refunds, disputes and failed recurring payments. Cash and checks entered by an admin are not emailed.',
    empty: 'Nobody is on the list, so payment notices go to the club contact.',
    removed: 'will stop getting payment notices.',
    addLabel: 'Add to payment notices',
    add: addPaymentNoticeRecipient,
    remove: removePaymentNoticeRecipient,
  },
} as const

/**
 * A list of people the site emails: the board copy list (one copy of every
 * message sent to families) or the payment notice list (one email per
 * payment). Same form for both.
 */
export function BoardCopyManager({
  recipients,
  list = 'board',
}: {
  recipients: Pick<BoardCopyRecipient, 'id' | 'name' | 'email'>[]
  list?: keyof typeof LISTS
}) {
  const copy = LISTS[list]
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await copy.add({ name, email })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setName('')
      setEmail('')
      router.refresh()
    })
  }

  function remove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await copy.remove(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-base text-clw-gray">{copy.intro}</p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}

      {recipients.length === 0 ? (
        <p className="rounded-md border border-clw-gold/10 bg-clw-black p-6 text-base text-clw-gray">
          {copy.empty}
        </p>
      ) : (
        <ul className="divide-y divide-clw-gold/10 rounded-md border border-clw-gold/10 bg-clw-black">
          {recipients.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-base text-clw-white">{r.name}</span>
                <span className="block truncate text-sm text-clw-gray">{r.email}</span>
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={pending} aria-label={`Remove ${r.name}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {r.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {r.name} {copy.removed}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(r.id)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-4 rounded-md border border-clw-gold/10 bg-clw-black p-4">
        <h2 className="font-display text-lg text-clw-gold">Add someone</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${list}_name`}>Name</Label>
            <Input id={`${list}_name`} required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${list}_email`}>Email</Label>
            <Input id={`${list}_email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : copy.addLabel}
        </Button>
      </form>
    </div>
  )
}
