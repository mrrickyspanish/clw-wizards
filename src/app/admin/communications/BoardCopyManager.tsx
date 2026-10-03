'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import type { BoardCopyRecipient } from '@/types/database'
import { addBoardRecipient, removeBoardRecipient } from './actions'
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

/**
 * Who is copied on every message sent to families. Each person gets one email
 * copy of each send (not one per family), headed with who it went to.
 */
export function BoardCopyManager({ recipients }: { recipients: BoardCopyRecipient[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addBoardRecipient({ name, email })
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
      const result = await removeBoardRecipient(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-base text-clw-gray">
        These people get one email copy of every message sent to families, including the automatic reminders. The copy
        starts with who the message went to. Anyone who already received it as a parent is not sent a second one.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}

      {recipients.length === 0 ? (
        <p className="rounded-md border border-clw-gold/10 bg-clw-black p-6 text-base text-clw-gray">
          Nobody is on the board copy list, so no copies are sent.
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
                      {r.name} will stop getting a copy of messages sent to families.
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
            <Label htmlFor="board_name">Name</Label>
            <Input id="board_name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board_email">Email</Label>
            <Input id="board_email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add to board copy'}
        </Button>
      </form>
    </div>
  )
}
