'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { startCheckout } from '@/lib/checkout-client'
import { duesCheckoutAmount, parseDollars, PAYMENT_PLAN_MIN_CENTS } from '@/lib/payments/dues-amount'
import { formatCents } from '@/lib/format/money'
import { PayButton } from './PayButton'

/**
 * Paying one dues record. Everyone gets "Pay the full balance". A family the
 * club put on a payment plan can also pay part of it (Tyler, Oct 24); the
 * same rules are checked again by the checkout route.
 */
export function DuesPayControls({
  duesId,
  remainingCents,
  paymentPlan,
  returnPath = '/dues',
}: {
  duesId: string
  remainingCents: number
  paymentPlan: boolean
  returnPath?: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fullLabel = `Pay ${formatCents(remainingCents)}`
  // Under the minimum there is nothing to split: the balance is the payment.
  if (!paymentPlan || remainingCents <= PAYMENT_PLAN_MIN_CENTS) {
    return <PayButton duesId={duesId} label={fullLabel} returnPath={returnPath} />
  }

  async function payPart(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const cents = parseDollars(value)
    if (cents === null) {
      setError('Enter a dollar amount, like 50 or 75.50.')
      return
    }
    const amount = duesCheckoutAmount({ remainingCents, paymentPlan, requestedCents: cents })
    if (!amount.ok) {
      setError(amount.error)
      return
    }
    setLoading(true)
    const result = await startCheckout({ flow: 'dues', duesId, amountCents: amount.amountCents, returnPath })
    if (!result.ok) {
      setError(result.message)
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  const typed = parseDollars(value)

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 sm:w-auto sm:items-end">
      <PayButton duesId={duesId} label={fullLabel} returnPath={returnPath} />
      {!open ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="max-sm:w-full"
          onClick={() => {
            setOpen(true)
            setError(null)
          }}
        >
          Pay another amount
        </Button>
      ) : (
        <form onSubmit={payPart} className="w-full max-w-full space-y-2 rounded-lg border border-clw-gold/15 bg-clw-black p-3 sm:w-72">
          <Label htmlFor={`amount-${duesId}`} className="text-base">
            Amount to pay
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-clw-gray">$</span>
            <Input
              id={`amount-${duesId}`}
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={value}
              onChange={(e) => {
                // The box already shows a $ sign.
                setValue(e.target.value.replace(/\$/g, ''))
                setError(null)
              }}
              placeholder={(PAYMENT_PLAN_MIN_CENTS / 100).toString()}
              className="pl-7 text-base"
            />
          </div>
          <p className="text-sm text-clw-gray">
            {formatCents(PAYMENT_PLAN_MIN_CENTS)} or more, up to {formatCents(remainingCents)}.
          </p>
          {error && <p className="text-base text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Starting checkout…' : typed ? `Pay ${formatCents(typed)}` : 'Pay'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
