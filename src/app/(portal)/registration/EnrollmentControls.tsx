'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { withdrawSeasonEnrollment } from './actions'
import { Button } from '@/components/ui/button'

/**
 * Withdraw only. Submitting now happens through the multi-step form at
 * /registration/[athleteId], because a registration carries wrestler details,
 * guardian contacts, and a signed waiver — none of which a single button can
 * collect.
 */
export function EnrollmentControls({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function withdraw() {
    setError(null)
    startTransition(async () => {
      const result = await withdrawSeasonEnrollment({ enrollmentId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={withdraw}>
        {pending ? 'Withdrawing…' : 'Withdraw'}
      </Button>
      {error && <p className="max-w-sm text-right text-sm text-red-400">{error}</p>}
    </div>
  )
}
