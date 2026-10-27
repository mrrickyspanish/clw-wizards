'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { formatUsPhone } from '@/lib/phone'
import type { FamilyContactInput } from '@/lib/family-contacts'

export type ManagedContact = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  // Set when the contact only gets messages about some of the wrestlers.
  forWrestlers: string | null
  // Admin page only (coachControls): the Coach box and the form's coaching answer.
  isCoach?: boolean
  interestedInCoaching?: boolean
}

type Result = { ok: true } | { ok: false; error: string }

/**
 * The people who also get a family's club emails (a second parent, a
 * grandparent), with add, edit and remove. Used on the parent's Profile page
 * and on the family's page in Admin -> Families, each with its own actions.
 */
export function FamilyContactsManager({
  contacts,
  max,
  save,
  remove,
  audience,
  coachControls = false,
}: {
  contacts: ManagedContact[]
  max: number
  save: (values: FamilyContactInput) => Promise<Result>
  remove: (id: string) => Promise<Result>
  // 'family' on Profile ("you"), 'admin' on the family's page.
  audience: 'family' | 'admin'
  // Admins: show and edit who is a coach. Never on the family's own Profile.
  coachControls?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // null: no form open. 'new': adding. Otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isCoach, setIsCoach] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function open(contact: ManagedContact | null) {
    setError(null)
    setNotice(null)
    setConfirmRemove(null)
    setEditing(contact ? contact.id : 'new')
    setName(contact?.name ?? '')
    setEmail(contact?.email ?? '')
    setPhone(contact?.phone ?? '')
    setIsCoach(contact?.isCoach ?? false)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await save({
        id: editing === 'new' ? undefined : (editing ?? undefined),
        name,
        email,
        phone,
        ...(coachControls ? { isCoach } : {}),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setNotice(editing === 'new' ? `${name.trim()} added.` : 'Saved.')
      setEditing(null)
      router.refresh()
    })
  }

  function confirmAndRemove(contact: ManagedContact) {
    setError(null)
    startTransition(async () => {
      const result = await remove(contact.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setConfirmRemove(null)
      setNotice(`${contact.name || contact.email || 'Contact'} removed.`)
      router.refresh()
    })
  }

  const form = (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-clw-gold/20 bg-clw-black/40 p-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name" className="text-base">
          Name
        </Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          autoComplete="off"
          className="text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email" className="text-base">
          Email
        </Label>
        <Input
          id="contact-email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          autoComplete="off"
          className="text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-phone" className="text-base">
          Cell phone
        </Label>
        <Input
          id="contact-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setError(null)
          }}
          autoComplete="off"
          className="text-base"
        />
        <p className="text-sm text-clw-gray">Club texts go to this number only after they agree to get them.</p>
      </div>
      {coachControls && (
        <label className="flex items-start gap-3 text-base text-clw-white">
          <Checkbox className="mt-1" checked={isCoach} onCheckedChange={(checked) => setIsCoach(checked === true)} />
          <span>
            <span className="block font-medium">Coach</span>
            <span className="block text-clw-gray">Gets messages sent to Coaches in Communications.</span>
          </span>
        </label>
      )}
      {error && <p className="text-base text-red-400">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(null)}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : editing === 'new' ? 'Add' : 'Save'}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-4">
      <p className="text-base text-clw-gray">
        {audience === 'family'
          ? 'A second parent, or anyone else who should get the club’s emails too. They don’t need a login.'
          : 'They get every email this family gets from Communications. No login needed.'}
      </p>

      {contacts.length === 0 && editing !== 'new' && (
        <p className="text-base text-clw-gray">
          {audience === 'family' ? 'No one added yet.' : 'No one else gets this family’s emails.'}
        </p>
      )}

      {contacts.length > 0 && (
        <ul className="space-y-3">
          {contacts.map((contact) =>
            editing === contact.id ? (
              <li key={contact.id}>{form}</li>
            ) : (
              <li key={contact.id} className="space-y-3 rounded-lg border border-clw-gold/10 bg-clw-black-2 p-4">
                <div className="min-w-0 space-y-0.5">
                  <p className="break-words text-base font-medium text-clw-white">{contact.name || 'No name'}</p>
                  <p className="break-words text-base text-clw-gray">
                    {contact.email ?? 'No email, so no club emails yet'}
                  </p>
                  {contact.phone && <p className="text-base text-clw-gray">{formatUsPhone(contact.phone)}</p>}
                  {contact.forWrestlers && <p className="text-sm text-clw-gray">For {contact.forWrestlers}</p>}
                  {coachControls && contact.isCoach && <p className="text-base text-clw-gold">Coach</p>}
                  {coachControls && contact.interestedInCoaching && (
                    <p className="text-base text-clw-gray">Expressed interest in coaching on the registration form.</p>
                  )}
                </div>
                {confirmRemove === contact.id ? (
                  <div className="space-y-2">
                    <p className="text-base text-clw-white">
                      Stop sending club emails to {contact.name || contact.email}?
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => setConfirmRemove(null)}
                      >
                        Keep
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => confirmAndRemove(contact)}
                        className="bg-red-600 text-white hover:bg-red-500"
                      >
                        {pending ? 'Removing…' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="max-sm:flex-1"
                      onClick={() => open(contact)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 max-sm:flex-1"
                      onClick={() => {
                        setNotice(null)
                        setError(null)
                        setEditing(null)
                        setConfirmRemove(contact.id)
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                    </Button>
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      )}

      {editing === 'new' && form}
      {error && editing === null && <p className="text-base text-red-400">{error}</p>}
      {notice && (
        <p role="status" className="text-base text-emerald-400">
          {notice}
        </p>
      )}

      {editing === null && contacts.length < max && (
        <Button type="button" variant="outline" className="max-sm:w-full" onClick={() => open(null)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add someone
        </Button>
      )}
      {editing === null && contacts.length >= max && (
        <p className="text-sm text-clw-gray">Up to {max} people. Remove one to add someone else.</p>
      )}
    </div>
  )
}
