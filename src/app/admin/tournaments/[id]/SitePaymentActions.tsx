'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { clearManualPayment, markRegistrationPaid, waiveRegistrationFee, type ActionResult } from '../actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// "Mark paid (cash or check)" and "Waive fee" for one site registration with
// a payment due (B4). The server action re-checks that the caller is an admin.
export function SitePaymentActions({ registrationId, wrestler, amount }: { registrationId: string; wrestler: string; amount: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<ActionResult>) {
    setBusy(true)
    setError(null)
    const result = await action()
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setError(null)
        setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-auto min-h-11 whitespace-normal py-2">
          Record payment<span className="sr-only"> for {wrestler}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record payment for {wrestler}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {amount} is due. Choose how it was settled. Card payments made on our site are recorded on their own.
            {error && (
              <span role="alert" className="mt-2 block text-red-400">
                {error}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button type="button" disabled={busy} className="h-auto min-h-11 whitespace-normal py-2" onClick={() => run(() => markRegistrationPaid(registrationId, 'cash'))}>
            Paid cash
          </Button>
          <Button type="button" disabled={busy} className="h-auto min-h-11 whitespace-normal py-2" onClick={() => run(() => markRegistrationPaid(registrationId, 'check'))}>
            Paid check
          </Button>
          <Button type="button" variant="outline" disabled={busy} className="h-auto min-h-11 whitespace-normal py-2" onClick={() => run(() => waiveRegistrationFee(registrationId))}>
            Waive fee
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// "Clear payment" for a cash, check or waived mark made by mistake (never a
// card payment). The server refuses when a card payment also covers the entry
// and writes a note saying who cleared it and when.
export function ClearPaymentAction({ registrationId, wrestler, mark }: { registrationId: string; wrestler: string; mark: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function clear() {
    setBusy(true)
    setError(null)
    const result = await clearManualPayment(registrationId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setError(null)
        setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-auto min-h-11 whitespace-normal py-2 text-clw-gray hover:text-red-400">
          Clear payment<span className="sr-only"> for {wrestler}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear the {mark} mark for {wrestler}?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Use this only to fix a mistake. The entry will show payment due again, and a note on it records who cleared it
            and when.
            {error && (
              <span role="alert" className="mt-2 block text-red-400">
                {error}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep the mark</AlertDialogCancel>
          <Button
            type="button"
            disabled={busy}
            className="h-auto min-h-11 whitespace-normal bg-red-600 py-2 text-white hover:bg-red-700"
            onClick={clear}
          >
            {busy ? 'Clearing...' : 'Clear payment'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
