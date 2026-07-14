'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SponsorTierRow } from '@/types/database'

type SponsorLevel = { value: string; label: string; amount: number }

export function SponsorCheckoutForm({ tiers }: { tiers: SponsorTierRow[] }) {
  // Only tiers with a set price can be checked out online.
  const levels: SponsorLevel[] = tiers
    .filter((t) => t.price_cents != null)
    .map((t) => ({ value: t.slug, label: t.label, amount: (t.price_cents as number) / 100 }))

  const [tier, setTier] = useState<string>(levels[0]?.value ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = levels.find((level) => level.value === tier) ?? levels[0]

  if (levels.length === 0) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const sponsorName = String(form.get('sponsorName') ?? '').trim()
    const contactName = String(form.get('contactName') ?? '').trim()
    const contactEmail = String(form.get('contactEmail') ?? '').trim()
    const websiteUrl = String(form.get('websiteUrl') ?? '').trim()

    if (!sponsorName || !contactName || !contactEmail) {
      setError('Business name, contact name, and email are required.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow: 'sponsor',
          sponsorName,
          contactName,
          contactEmail,
          websiteUrl: websiteUrl || undefined,
          tier,
          returnPath: '/sponsorship',
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Unable to start sponsorship checkout.')
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
    <form onSubmit={handleSubmit} className="mt-10 space-y-5 border border-clw-black/15 bg-[#F7F7F7] p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-clw-black/70">Business name</span>
          <Input name="sponsorName" required className="border-clw-black/25 bg-clw-white text-clw-black" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-clw-black/70">Contact name</span>
          <Input name="contactName" required className="border-clw-black/25 bg-clw-white text-clw-black" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-clw-black/70">Email</span>
          <Input name="contactEmail" type="email" required className="border-clw-black/25 bg-clw-white text-clw-black" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-clw-black/70">Website</span>
          <Input name="websiteUrl" type="url" placeholder="https://" className="border-clw-black/25 bg-clw-white text-clw-black" />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-clw-black/70">Sponsorship level</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {levels.map((level) => (
            <label
              key={level.value}
              className={`cursor-pointer border p-4 transition ${
                tier === level.value
                  ? 'border-clw-gold bg-clw-gold/15'
                  : 'border-clw-black/20 bg-clw-white hover:border-clw-gold'
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={level.value}
                checked={tier === level.value}
                onChange={() => setTier(level.value)}
                className="sr-only"
              />
              <span className="block font-display text-xl uppercase text-clw-black">{level.label}</span>
              <span className="mt-1 block font-cond text-2xl tracking-wide text-clw-gold-on-light">${level.amount.toLocaleString('en-US')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="h-14 w-full rounded-none bg-clw-black font-display text-xl uppercase tracking-wide text-clw-gold hover:bg-clw-gold hover:text-clw-black">
        {loading ? 'Starting checkout...' : `Continue to Stripe for $${selected ? selected.amount.toLocaleString('en-US') : ''}`}
      </Button>
    </form>
  )
}
