'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { setBirthCertificateOnFile } from './actions'
import { Switch } from '@/components/ui/switch'

/**
 * "Returning wrestler: birth certificate on file". Used on Registrations and
 * on the family page, so either place shows and changes the same setting.
 */
export function BirthCertificateToggle({
  athleteId,
  onFile,
  recordedBy,
  recordedAt,
}: {
  athleteId: string
  onFile: boolean
  recordedBy: string | null
  recordedAt: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function change(next: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await setBirthCertificateOnFile({ athleteId, onFile: next })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-3">
        <Switch checked={onFile} disabled={pending} onCheckedChange={change} />
        <span className="text-sm text-clw-white">Returning wrestler: birth certificate on file</span>
      </label>
      {onFile && recordedAt && (
        <p className="text-sm text-clw-gray">
          Marked by {recordedBy ?? 'an admin'} ·{' '}
          {new Date(recordedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
