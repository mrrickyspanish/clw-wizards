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
        body: JSON.stringify({
          flow: 'donation',
          amountCents: Math.round(effectiveDollars * 100),
          recurring: false,
        }),
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
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/20 bg-clw-black-2 p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <HandCoins className="h-6 w-6 text-clw-gold-ink" />
        <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white sm:text-4xl">Support the Wizards</h2>
      </div>
      <p className="mt-1 text-base leading-relaxed text-clw-gray">Every gift goes straight back to the wrestlers.</p>
      <p className="mt-1 text-sm text-clw-gray">One-time donations only for MVP 1.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
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
                  ? 'rounded-md border border-clw-gold bg-clw-gold/15 py-3 text-base font-semibold text-clw-gold'
                  : 'rounded-md border border-clw-gold/20 py-3 text-base text-clw-gray hover:border-clw-gold/50 hover:text-clw-gold'
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
                ? 'col-span-2 rounded-md border border-clw-gold bg-clw-gold/15 py-3 text-base font-semibold text-clw-gold sm:col-span-1'
                : 'col-span-2 rounded-md border border-clw-gold/20 py-3 text-base text-clw-gray hover:border-clw-gold/50 hover:text-clw-gold sm:col-span-1'
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
            className="text-base"
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={loading} className="chamfer-sm h-12 w-full rounded-none text-base font-semibold">
          {loading ? 'Starting checkout...' : `Donate $${effectiveDollars || 0}`}
        </Button>
      </form>
    </div>
  )
}
