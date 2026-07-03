'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { setFamilyActive } from './actions'
import { Button } from '@/components/ui/button'

export function FamilyActiveToggle({ parentId, isActive }: { parentId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)
    const result = await setFamilyActive(parentId, !isActive)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="text-right">
      <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading}>
        {loading ? 'Updating…' : isActive ? 'Deactivate account' : 'Reactivate account'}
      </Button>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
