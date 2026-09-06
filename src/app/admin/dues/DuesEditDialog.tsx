'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

import type { DuesPayment } from '@/types/database'
import { updateDuesPayment, type DuesBalanceState, type DuesInput } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

function dollars(cents: number) {
  return (cents / 100).toFixed(2)
}

function initialBalanceState(status: DuesPayment['status']): DuesBalanceState {
  if (status === 'waived') return 'waived'
  if (status === 'overdue') return 'overdue'
  return 'standard'
}

function toCents(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) : Number.NaN
}

export function DuesEditDialog({
  dues,
  triggerLabel = 'Edit dues',
}: {
  dues: DuesPayment
  triggerLabel?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(dollars(dues.amount_cents))
  const [amountPaid, setAmountPaid] = useState(dollars(dues.amount_paid_cents))
  const [dueDate, setDueDate] = useState(dues.due_date ?? '')
  const [paymentPlan, setPaymentPlan] = useState(dues.payment_plan)
  const [balanceState, setBalanceState] = useState<DuesBalanceState>(initialBalanceState(dues.status))
  const [waiverNote, setWaiverNote] = useState(dues.waived_note ?? '')

  const stripeLinked = Boolean(dues.stripe_payment_intent_id || dues.stripe_checkout_session_id)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const amountCents = toCents(amount)
    const amountPaidCents = toCents(amountPaid)
    if (!Number.isFinite(amountCents) || !Number.isFinite(amountPaidCents)) {
      setError('Enter valid dollar amounts.')
      return
    }

    setLoading(true)
    const values: DuesInput = {
      amount_cents: amountCents,
      amount_paid_cents: amountPaidCents,
      due_date: dueDate,
      payment_plan: paymentPlan,
      balance_state: balanceState,
      waived_note: waiverNote,
    }

    const result = await updateDuesPayment(dues.id, values)
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
          <Pencil className="mr-1.5 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Edit dues</DialogTitle>
          <DialogDescription>
            {dues.season} · current status: {dues.status}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {stripeLinked && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertDescription className="text-amber-100">
                This record has Stripe payment history. Changing the recorded paid amount updates club reporting and the
                remaining balance shown to the family, but it does not issue a Stripe refund.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`dues_amount_${dues.id}`}>Amount billed</Label>
              <Input
                id={`dues_amount_${dues.id}`}
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`dues_paid_${dues.id}`}>Recorded paid</Label>
              <Input
                id={`dues_paid_${dues.id}`}
                type="number"
                min="0"
                step="0.01"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-clw-gray">
            Recorded paid can also be used for cash, check, or another offline payment. Paid and partial statuses are
            calculated from these two amounts.
          </p>

          <div className="space-y-2">
            <Label htmlFor={`dues_due_${dues.id}`}>Due date</Label>
            <Input
              id={`dues_due_${dues.id}`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Balance handling</Label>
            <Select value={balanceState} onValueChange={(value) => setBalanceState(value as DuesBalanceState)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="overdue">Mark overdue</SelectItem>
                <SelectItem value="waived">Waive balance</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-clw-gray">
              Standard becomes pending, partial, or paid automatically based on the recorded payment.
            </p>
          </div>

          {balanceState === 'waived' && (
            <div className="space-y-2">
              <Label htmlFor={`dues_waiver_${dues.id}`}>Waiver note</Label>
              <Textarea
                id={`dues_waiver_${dues.id}`}
                maxLength={500}
                required
                placeholder="Why is this balance being waived?"
                value={waiverNote}
                onChange={(e) => setWaiverNote(e.target.value)}
              />
            </div>
          )}

          <label className="flex items-start gap-3 rounded-md border border-clw-gold/10 bg-clw-black-2 p-3 text-sm text-clw-white">
            <Checkbox
              className="mt-0.5"
              checked={paymentPlan}
              onCheckedChange={(checked) => setPaymentPlan(checked === true)}
            />
            <span>
              <span className="block font-medium">Payment plan</span>
              <span className="mt-1 block text-clw-gray">Flag this family as paying the balance over time.</span>
            </span>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save dues'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
