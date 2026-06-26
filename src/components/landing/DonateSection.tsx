'use client'

import { useState, type FormEvent } from 'react'
import { HandCoins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESETS = [25, 50, 100, 250]

export function DonateSection() {
  const [amount, setAmount] = useState<number>(50)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveDollars = showCustom ? Number(custom) : amount

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!Number.isFinite(effectiveDollars) || effectiveDollars < 1) {
      setError('Enter an amount of at least $1.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'donation', amountCents: Math.round(effectiveDollars * 100) }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
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

  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <div className="flex items-center gap-2">
        <HandCoins className="h-5 w-5 text-clw-gold-ink" />
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Support the Wizards</h2>
      </div>
      <p className="mt-1 text-sm text-clw-gray">Every gift goes straight back to the wrestlers.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col">
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset)
                setShowCustom(false)
              }}
              className={
                !showCustom && amount === preset
                  ? 'rounded-md border border-clw-gold bg-clw-gold/10 py-2 text-sm font-medium text-clw-gold'
                  : 'rounded-md border border-clw-gold/15 py-2 text-sm text-clw-gray hover:border-clw-gold/40 hover:text-clw-gold'
              }
            >
              ${preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className={
              showCustom
                ? 'rounded-md border border-clw-gold bg-clw-gold/10 py-2 text-sm font-medium text-clw-gold'
                : 'rounded-md border border-clw-gold/15 py-2 text-sm text-clw-gray hover:border-clw-gold/40 hover:text-clw-gold'
            }
          >
            Other
          </button>
        </div>

        {showCustom && (
          <Input
            type="number"
            min="1"
            step="1"
            autoFocus
            placeholder="Amount (USD)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="mt-3"
          />
        )}

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <Button type="submit" disabled={loading} className="chamfer-sm mt-auto w-full rounded-none">
          {loading ? 'Starting checkout…' : `Donate $${effectiveDollars || 0}`}
        </Button>
      </form>
    </div>
  )
}
