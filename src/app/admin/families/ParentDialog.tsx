'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

import type { Profile } from '@/types/database'
import { ORG } from '@/config/org.config'
import { updateParent, type ParentInput } from './actions'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type EditableParent = Pick<
  Profile,
  'id' | 'full_name' | 'email' | 'phone' | 'practice_group' | 'sms_opt_in'
>

export function ParentDialog({ parent }: { parent: EditableParent }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(parent.full_name ?? '')
  const [email, setEmail] = useState(parent.email ?? '')
  const [phone, setPhone] = useState(parent.phone ?? '')
  const [practiceGroup, setPracticeGroup] = useState(parent.practice_group ?? 'none')
  const [smsOptIn, setSmsOptIn] = useState(parent.sms_opt_in)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const values: ParentInput = {
      full_name: fullName,
      email,
      phone,
      practice_group: practiceGroup === 'none' ? '' : practiceGroup,
      sms_opt_in: smsOptIn,
    }

    const result = await updateParent(parent.id, values)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
          <Pencil className="mr-1.5 h-4 w-4" /> Edit parent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Edit parent account</DialogTitle>
          <DialogDescription>
            Update the primary guardian&apos;s contact information and account email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="parent_full_name">Full name</Label>
            <Input
              id="parent_full_name"
              required
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_email">Email</Label>
            <Input
              id="parent_email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <p className="text-sm text-clw-gray">
              Changing this also changes the email the parent uses to sign in.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_phone">Phone</Label>
            <Input
              id="parent_phone"
              type="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary practice group</Label>
            <Select value={practiceGroup} onValueChange={setPracticeGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {ORG.practiceGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-clw-gold/15 bg-clw-gold/5 p-4">
            <label className="flex items-start gap-3 text-sm text-clw-white">
              <Checkbox
                className="mt-0.5"
                checked={smsOptIn}
                onCheckedChange={(checked) => setSmsOptIn(checked === true)}
              />
              <span>
                <span className="block font-medium">SMS communication consent</span>
                <span className="mt-1 block leading-relaxed text-clw-gray">
                  Only enable this after the parent has explicitly agreed to receive club text messages. Turning it off
                  preserves the prior consent record.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
