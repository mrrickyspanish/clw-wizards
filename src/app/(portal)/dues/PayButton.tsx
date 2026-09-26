'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { startCheckout } from '@/lib/checkout-client'

export function PayButton({
  duesId,
  label,
  returnPath = '/dues',
}: {
  duesId: string
  label: string
  returnPath?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    const result = await startCheckout({ flow: 'dues', duesId, returnPath })
    if (!result.ok) {
      setError(result.message)
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" onClick={handlePay} disabled={loading}>
        {loading ? 'Starting checkout…' : label}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
