'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { setFamilyActive } from './actions'
import { Button } from '@/components/ui/button'

export function FamilyActiveToggle({
  parentId,
  isActive,
  familyId,
  fullWidth = false,
}: {
  parentId: string
  isActive: boolean
  familyId?: string
  /** Stretch to the width of its container (the account section of a family's page). */
  fullWidth?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)
    const result = await setFamilyActive(parentId, !isActive, familyId)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className={fullWidth ? 'w-full' : 'text-right'}>
      <Button
        variant="outline"
        size={fullWidth ? 'default' : 'sm'}
        className={fullWidth ? 'w-full' : undefined}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? 'Updating…' : isActive ? 'Deactivate account' : 'Reactivate account'}
      </Button>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
