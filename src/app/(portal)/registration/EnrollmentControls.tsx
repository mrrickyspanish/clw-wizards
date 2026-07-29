'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { submitSeasonEnrollment, withdrawSeasonEnrollment } from './actions'
import { Button } from '@/components/ui/button'

export function EnrollmentControls({
  seasonRegistrationId,
  athleteId,
  enrollmentId,
  canSubmit,
  resubmitting = false,
}: {
  seasonRegistrationId: string
  athleteId: string
  enrollmentId?: string | null
  canSubmit: boolean
  resubmitting?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await submitSeasonEnrollment({ seasonRegistrationId, athleteId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function withdraw() {
    if (!enrollmentId) return
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        {enrollmentId && (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={withdraw}>
            Withdraw
          </Button>
        )}
        <Button type="button" size="sm" disabled={pending || !canSubmit} onClick={submit}>
          {pending ? 'Submitting…' : resubmitting ? 'Resubmit for review' : 'Submit registration'}
        </Button>
      </div>
      {error && <p className="max-w-sm text-right text-xs text-red-400">{error}</p>}
    </div>
  )
}
