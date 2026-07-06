'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DonationCheckoutFormProps {
  recurring?: boolean
  presets: number[]
  defaultAmount: number
  buttonLabel: string
  light?: boolean
}

export function DonationCheckoutForm({
  recurring = false,
  presets,
  defaultAmount,
  buttonLabel,
  light = false,
}: DonationCheckoutFormProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveAmount = showCustom ? Number(custom) : amount

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 1) {
      setError('Enter an amount of at least $1.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow: 'donation',
          amountCents: Math.round(effectiveAmount * 100),
          recurring,
          returnPath: '/sponsorship',
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Unable to start checkout.')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const inactiveClass = light
    ? 'border-clw-black/20 text-clw-black/70 hover:border-clw-black/50 hover:text-clw-black'
    : 'border-clw-gold/25 text-clw-gray hover:border-clw-gold/60 hover:text-clw-gold'

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(preset)
              setShowCustom(false)
            }}
            className={`min-h-12 border px-4 py-3 font-cond text-xl tracking-wide transition ${
              !showCustom && amount === preset
                ? 'border-clw-gold bg-clw-gold text-clw-black'
                : inactiveClass
            }`}
          >
            ${preset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className={`min-h-12 border px-4 py-3 font-cond text-xl tracking-wide transition ${
            showCustom ? 'border-clw-gold bg-clw-gold text-clw-black' : inactiveClass
          }`}
        >
          Other
        </button>
      </div>

      {showCustom && (
        <Input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          autoFocus
          placeholder="Amount in dollars"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          className={light ? 'border-clw-black/25 bg-clw-white text-clw-black' : ''}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className={`h-14 w-full rounded-none font-display text-xl uppercase tracking-wide ${
          light ? 'bg-clw-black text-clw-gold hover:bg-clw-gold hover:text-clw-black' : ''
        }`}
      >
        {loading ? 'Starting checkout...' : `${buttonLabel} $${effectiveAmount || 0}`}
      </Button>
    </form>
  )
}
