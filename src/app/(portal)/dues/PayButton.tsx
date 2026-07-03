'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function PayButton({ duesId, label }: { duesId: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'dues', duesId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Unable to start checkout.')
        setLoading(false)
        return
      }
      // Hand off to Stripe's hosted checkout.
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
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
