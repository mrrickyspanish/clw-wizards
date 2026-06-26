'use client'

import { useState, type FormEvent } from 'react'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const PRESETS = [25, 50, 100, 250]

export function DonateSection() {
  const [amount, setAmount] = useState<number>(50)
  const [custom, setCustom] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A non-empty custom amount wins over the preset selection.
  const effectiveDollars = custom.trim() ? Number(custom) : amount

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!Number.isFinite(effectiveDollars) || effectiveDollars < 1) {
      setError('Enter a donation amount of at least $1.')
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
          recurring,
          donorName: name || undefined,
          donorEmail: email || undefined,
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
    <section id="donate" className="border-b border-clw-gold/10 bg-clw-black-2">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h2 className="font-display text-3xl text-clw-gold">Support the club</h2>
        <p className="mt-2 text-clw-gray">
          Donations help keep {ORG.shortName} affordable and growing. Every bit goes back to the wrestlers.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset)
                  setCustom('')
                }}
                className={
                  !custom.trim() && amount === preset
                    ? 'rounded-md border border-clw-gold bg-clw-gold/10 px-4 py-2 text-sm font-medium text-clw-gold'
                    : 'rounded-md border border-clw-gold/20 px-4 py-2 text-sm text-clw-gray hover:text-clw-gold'
                }
              >
                ${preset}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom">Or enter an amount</Label>
            <Input
              id="custom"
              type="number"
              min="1"
              step="1"
              placeholder="Custom amount (USD)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="donorName">Name (optional)</Label>
              <Input id="donorName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="donorEmail">Email (optional)</Label>
              <Input id="donorEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-clw-gray">
            <Checkbox checked={recurring} onCheckedChange={(checked) => setRecurring(checked === true)} />
            Make this a monthly donation
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Starting checkout…' : `Donate $${effectiveDollars || 0}${recurring ? '/mo' : ''}`}
          </Button>
        </form>
      </div>
    </section>
  )
}
