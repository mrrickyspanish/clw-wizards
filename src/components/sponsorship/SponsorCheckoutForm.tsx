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

  const inputClassName =
    'h-14 rounded-none border-clw-ink/25 bg-white px-4 text-clw-ink placeholder:text-clw-muted-dark/65 focus-visible:ring-clw-gold focus-visible:ring-offset-[#F7F7F7]'
  const labelClassName = 'font-cond text-sm font-semibold uppercase tracking-[0.16em] text-clw-ink/75'

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6 border border-clw-ink/15 bg-[#F7F7F7] p-6 text-clw-ink sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2.5">
          <span className={labelClassName}>Business name</span>
          <Input name="sponsorName" required className={inputClassName} />
        </label>
        <label className="space-y-2.5">
          <span className={labelClassName}>Contact name</span>
          <Input name="contactName" required className={inputClassName} />
        </label>
        <label className="space-y-2.5">
          <span className={labelClassName}>Email</span>
          <Input name="contactEmail" type="email" required className={inputClassName} />
        </label>
        <label className="space-y-2.5">
          <span className={labelClassName}>Website</span>
          <Input name="websiteUrl" type="url" placeholder="https://" className={inputClassName} />
        </label>
      </div>

      <fieldset>
        <legend className={labelClassName}>Sponsorship level</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {levels.map((level) => (
            <label
              key={level.value}
              className={`cursor-pointer border p-5 transition ${
                tier === level.value
                  ? 'border-clw-gold bg-clw-gold/15'
                  : 'border-clw-ink/20 bg-white hover:border-clw-gold'
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
              <span className="block font-display text-xl uppercase text-clw-ink">{level.label}</span>
              <span className="mt-1 block font-cond text-2xl tracking-wide text-clw-gold-on-light">${level.amount.toLocaleString('en-US')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="h-14 w-full rounded-none bg-[#0B0B0B] font-display text-xl uppercase tracking-wide text-clw-gold hover:bg-clw-gold hover:text-[#0B0B0B]"
      >
        {loading ? 'Starting checkout...' : `Continue to Stripe for $${selected ? selected.amount.toLocaleString('en-US') : ''}`}
      </Button>
    </form>
  )
}
