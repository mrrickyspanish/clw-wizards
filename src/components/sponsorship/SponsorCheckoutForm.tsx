'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SPONSOR_LEVELS = [
  { value: 'white', label: 'White Sponsor', amount: 150 },
  { value: 'black', label: 'Black Sponsor', amount: 250 },
  { value: 'yellow', label: 'Gold Sponsor', amount: 500 },
  { value: 'platinum', label: 'Platinum Sponsor', amount: 1000 },
] as const

type SponsorTier = (typeof SPONSOR_LEVELS)[number]['value']

export function SponsorCheckoutForm() {
  const [tier, setTier] = useState<SponsorTier>('yellow')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = SPONSOR_LEVELS.find((level) => level.value === tier) ?? SPONSOR_LEVELS[2]

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
          {SPONSOR_LEVELS.map((level) => (
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
              <span className="mt-1 block font-cond text-2xl tracking-wide text-clw-gold-on-light">${level.amount}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="h-14 w-full rounded-none bg-clw-black font-display text-xl uppercase tracking-wide text-clw-gold hover:bg-clw-gold hover:text-clw-black">
        {loading ? 'Starting checkout...' : `Continue to Stripe for $${selected.amount}`}
      </Button>
    </form>
  )
}
