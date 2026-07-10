'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarX, X } from 'lucide-react'

import type { PracticeCancellation } from '@/types/database'
import { cancelPracticeDate, removePracticeCancellation } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CancelDateDialog({
  practiceId,
  label,
  cancellations,
}: {
  practiceId: string
  label: string
  cancellations: PracticeCancellation[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const count = cancellations.length

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await cancelPracticeDate({ practice_id: practiceId, date, reason })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDate('')
    setReason('')
    router.refresh()
  }

  async function handleRemove(id: string) {
    const result = await removePracticeCancellation(id)
    if (result.ok) router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
          <CalendarX className="mr-1.5 h-4 w-4" />
          {count > 0 ? `Cancelled ${count}` : 'Cancel a date'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Cancel a date</DialogTitle>
          <DialogDescription>
            Skip {label} on a single date (a holiday) without changing the weekly schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="cancel_date">Date to cancel</Label>
              <Input id="cancel_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Cancel it'}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel_reason">Reason (optional)</Label>
            <Input id="cancel_reason" placeholder="Holiday, closure…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </form>

        {count > 0 && (
          <div className="mt-2 border-t border-clw-gold/10 pt-3">
            <p className="mb-2 text-sm text-clw-gray">Cancelled dates</p>
            <ul className="space-y-2">
              {cancellations.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-md bg-clw-black px-3 py-2 text-sm">
                  <span className="text-clw-white">
                    {formatDate(c.date)}
                    {c.reason ? <span className="text-clw-gray"> · {c.reason}</span> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    aria-label="Remove cancellation"
                    className="text-clw-gray hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
