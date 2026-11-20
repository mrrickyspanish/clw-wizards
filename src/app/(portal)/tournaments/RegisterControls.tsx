'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { registerAthletes, withdrawRegistration } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PAID_ENTRY_NOTE, isEntryLocked, type RegistrationState } from './RegisterAndPayForm'

// The page imports both registration controls from this file, so its existing
// tests (which stand in for this one module) keep working.
export { RegisterAndPayForm, type EntryAthlete, type RegistrationState } from './RegisterAndPayForm'

export type AthleteOption = { id: string; name: string }

/**
 * Free in-house tournaments (no cost set): Register and Withdraw, one wrestler
 * at a time. Owners and linked co-parents both see and use these; the server
 * actions check the same guardianship rule as the database.
 */
export function RegisterControls({
  tournamentId,
  athletes,
  registrations,
}: {
  tournamentId: string
  athletes: AthleteOption[]
  // keyed by athlete id
  registrations: Record<string, RegistrationState>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (athletes.length === 0) {
    return <p className="text-base text-clw-gray">Add an athlete to your roster before registering.</p>
  }

  function run(athleteId: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    setBusyId(athleteId)
    startTransition(async () => {
      const result = await fn()
      setBusyId(null)
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.')
        return
      }
      router.refresh()
    })
  }

  const hasLocked = athletes.some((a) => {
    const reg = registrations[a.id]
    return reg && reg.status !== 'withdrawn' && isEntryLocked(reg)
  })

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="text-base text-red-400">{error}</p>}
      {athletes.map((a) => {
        const reg = registrations[a.id]
        const isRegistered = reg && reg.status !== 'withdrawn'
        // A paid entry (from when the tournament had a cost) is withdrawn by the club.
        const locked = isRegistered && isEntryLocked(reg)
        const busy = pending && busyId === a.id
        return (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="min-w-0 break-words text-base text-clw-white">{a.name}</span>
            {isRegistered ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink">
                  {locked ? (reg.paymentMethod === 'waived' ? 'waived' : 'paid') : reg.status}
                </Badge>
                {!locked && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-base"
                    disabled={busy}
                    onClick={() => run(a.id, () => withdrawRegistration({ registrationId: reg.id }))}
                  >
                    {busy ? '…' : 'Withdraw'}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className="text-base"
                disabled={busy}
                onClick={() => run(a.id, () => registerAthletes({ tournamentId, athleteIds: [a.id] }))}
              >
                {busy ? 'Registering…' : reg ? 'Register again' : 'Register'}
              </Button>
            )}
          </div>
        )
      })}
      {hasLocked && <p className="text-base text-clw-gray">{PAID_ENTRY_NOTE}</p>}
    </div>
  )
}
