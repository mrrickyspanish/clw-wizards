'use client'

import { useState } from 'react'
import { FileText, Pencil, UserPlus } from 'lucide-react'

import { addGiverAction } from './demo-giving-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CHURCH_FUNDS as FUNDS, churchFund } from '@/lib/demo-giving'

// Church demo only (SBC, Nov 20): the Giving Admin's "Add giver" and the
// giving statements that are coming for SBC.
export function DemoGivingActions() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [fund, setFund] = useState(FUNDS[0])
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const result = await addGiverAction({ name, amount, fund })
    setSaving(false)
    setMessage(result.error)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); setMessage(null) }}>
        <DialogTrigger asChild>
          <Button type="button" className="min-h-11">
            <UserPlus className="mr-2 h-4 w-4" /> Add giver
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add giver</DialogTitle>
            <DialogDescription className="text-base">A giving record only: no member login or staff account is made.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giver-name">Name</Label>
              <Input id="giver-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="giver-amount">Gift amount</Label>
              <Input id="giver-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="giver-fund">Fund</Label>
              <select
                id="giver-fund"
                value={fund}
                onChange={(e) => setFund(e.target.value)}
                className="min-h-11 w-full rounded-md border border-clw-gold/20 bg-clw-black-2 px-3 text-base text-clw-white"
              >
                {FUNDS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            {message && <p className="text-base text-red-400">{message}</p>}
            <Button type="button" onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save giver'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button type="button" variant="outline" disabled className="min-h-11 normal-case tracking-normal disabled:opacity-90">
        <FileText className="mr-2 h-4 w-4" /> Giving statements (coming soon)
      </Button>
    </div>
  )
}

// Church demo only (critic B1, Nov 20): editing a gift is a gift, not a bill.
// Same read-only answer as "Add giver"; nothing saves.
export function ChurchGiftEditDialog({ id, giver, cents, date }: { id: string; giver: string; cents: number; date: string | null }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState((cents / 100).toFixed(2))
  const [fund, setFund] = useState(churchFund(id))
  const [given, setGiven] = useState(date ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const result = await addGiverAction({ name: giver, amount, fund })
    setSaving(false)
    setMessage(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setMessage(null) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-11 text-clw-gray hover:text-clw-gold">
          <Pencil className="mr-1.5 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit gift</DialogTitle>
          <DialogDescription className="text-base">A gift from {giver}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`gift-amount-${id}`}>Gift amount</Label>
            <Input id={`gift-amount-${id}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`gift-fund-${id}`}>Fund</Label>
            <select
              id={`gift-fund-${id}`}
              value={fund}
              onChange={(e) => setFund(e.target.value)}
              className="min-h-11 w-full rounded-md border border-clw-gold/20 bg-clw-black-2 px-3 text-base text-clw-white"
            >
              {FUNDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`gift-date-${id}`}>Date given</Label>
            <Input id={`gift-date-${id}`} type="date" value={given} onChange={(e) => setGiven(e.target.value)} />
          </div>
          {message && <p className="text-base text-red-400">{message}</p>}
          <Button type="button" onClick={save} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save gift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
