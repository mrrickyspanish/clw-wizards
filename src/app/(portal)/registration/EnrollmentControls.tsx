'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { withdrawSeasonEnrollment } from './actions'
import { Button } from '@/components/ui/button'
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
 * Withdraw only. Submitting now happens through the multi-step form at
 * /registration/[athleteId], because a registration carries wrestler details,
 * guardian contacts, and a signed waiver — none of which a single button can
 * collect. Withdrawing asks first: it takes the wrestler out of the season.
 */
export function EnrollmentControls({ enrollmentId, athleteName }: { enrollmentId: string; athleteName: string }) {
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ghost" size="sm" disabled={pending}>
            {pending ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw {athleteName} from the season?</AlertDialogTitle>
            <AlertDialogDescription>
              {athleteName}&apos;s registration will be withdrawn. You can register again while registration is open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep registration</AlertDialogCancel>
            <AlertDialogAction onClick={withdraw}>Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="max-w-sm text-right text-sm text-red-400">{error}</p>}
    </div>
  )
}
