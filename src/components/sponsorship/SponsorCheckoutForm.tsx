'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SponsorTierRow } from '@/types/database'
import { CTA_TYPE } from '@/lib/cta'

type SponsorLevel = { value: string; label: string; amount: number }

function tierBandClass(value: string) {
  switch (value) {
    case 'white':
      return 'bg-white ring-1 ring-inset ring-clw-ink/25'
    case 'black':
      return 'bg-[#111111]'
    case 'yellow':
      return 'bg-clw-gold'
    case 'platinum':
      return 'bg-[#BFC3C9]'
    default:
      return 'bg-clw-gold'
  }
}

export function SponsorCheckoutForm({
  tiers,
  returnPath = '/sponsorship',
}: {
  tiers: SponsorTierRow[]
  returnPath?: string
}) {
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
          returnPath,
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
    'h-12 rounded-none border-clw-ink/25 bg-white px-4 text-base text-clw-ink placeholder:text-clw-muted-dark/65 focus-visible:ring-clw-gold focus-visible:ring-offset-[#F7F7F7] sm:h-14'
  const labelClassName = 'font-cond text-sm font-semibold uppercase tracking-[0.15em] text-clw-ink/75 sm:tracking-[0.16em]'

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 border border-clw-ink/15 bg-[#F7F7F7] p-4 text-clw-ink sm:mt-10 sm:space-y-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <label className="space-y-2">
          <span className={labelClassName}>Business name</span>
          <Input name="sponsorName" required className={inputClassName} />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Contact name</span>
          <Input name="contactName" required className={inputClassName} />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Email</span>
          <Input name="contactEmail" type="email" required className={inputClassName} />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Website</span>
          <Input name="websiteUrl" type="url" placeholder="https://" className={inputClassName} />
        </label>
      </div>

      <fieldset>
        <legend className={labelClassName}>Sponsorship level</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {levels.map((level) => (
            <label
              key={level.value}
              className={`relative cursor-pointer overflow-hidden border bg-white p-4 pt-6 transition sm:p-5 sm:pt-7 ${
                tier === level.value
                  ? 'border-clw-gold shadow-[0_0_0_1px_rgba(240,192,32,.35)]'
                  : 'border-clw-ink/20 hover:border-clw-gold'
              }`}
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-2 ${tierBandClass(level.value)}`} />
              <input
                type="radio"
                name="tier"
                value={level.value}
                checked={tier === level.value}
                onChange={() => setTier(level.value)}
                className="sr-only"
              />
              <span className="block font-display text-base uppercase leading-tight text-clw-ink sm:text-xl">{level.label}</span>
              <span className="mt-2 block font-cond text-xl tracking-wide text-clw-gold-on-light sm:text-2xl">${level.amount.toLocaleString('en-US')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className={`h-[3.25rem] w-full rounded-none bg-[#0B0B0B] ${CTA_TYPE} text-clw-gold hover:bg-clw-gold hover:text-[#0B0B0B] sm:h-14`}
      >
        {loading ? 'Starting checkout...' : `Continue to Stripe for $${selected ? selected.amount.toLocaleString('en-US') : ''}`}
      </Button>
    </form>
  )
}
