'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { registerAthletes, withdrawRegistration } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type AthleteOption = { id: string; name: string }
export type RegistrationState = { id: string; status: string }

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
    return <p className="text-sm text-clw-gray">Add an athlete to your roster before registering.</p>
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

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {athletes.map((a) => {
        const reg = registrations[a.id]
        const isRegistered = reg && reg.status !== 'withdrawn'
        const busy = pending && busyId === a.id
        return (
          <div key={a.id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-clw-white">{a.name}</span>
            {isRegistered ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink">
                  {reg.status}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(a.id, () => withdrawRegistration({ registrationId: reg.id }))}
                >
                  {busy ? '…' : 'Withdraw'}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => run(a.id, () => registerAthletes({ tournamentId, athleteIds: [a.id] }))}
              >
                {busy ? 'Registering…' : reg ? 'Register again' : 'Register'}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
