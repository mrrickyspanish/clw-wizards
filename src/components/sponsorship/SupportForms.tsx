'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

const SPONSOR_LEVELS = [
  { value: 'white', label: 'White Sponsor', amount: 150 },
  { value: 'black', label: 'Black Sponsor', amount: 250 },
  { value: 'yellow', label: 'Gold Sponsor', amount: 500 },
  { value: 'platinum', label: 'Platinum Sponsor', amount: 1000 },
] as const

export function SponsorCheckoutForm() {
  const [tier, setTier] = useState<(typeof SPONSOR_LEVELS)[number]['value']>('gold' as never)
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
              <span className="mt-1 block font-cond text-2xl tracking-wide text-clw-gold-dim">${level.amount}</span>
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

export function SupportInquiryForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const payload = {
      firstName: String(form.get('firstName') ?? '').trim(),
      lastName: String(form.get('lastName') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      topic: String(form.get('topic') ?? '').trim(),
      message: String(form.get('message') ?? '').trim(),
      company: String(form.get('company') ?? '').trim(),
    }

    try {
      const response = await fetch('/api/support-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Unable to send your message.')
        setLoading(false)
        return
      }

      event.currentTarget.reset()
      setSuccess(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-14 space-y-6">
      <div className="hidden" aria-hidden>
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="firstName" required placeholder="First name" className="border-clw-black/25 bg-clw-white px-6 py-5 text-xl text-clw-black" />
        <Input name="lastName" required placeholder="Last name" className="border-clw-black/25 bg-clw-white px-6 py-5 text-xl text-clw-black" />
      </div>
      <Input name="email" type="email" required placeholder="Email" className="border-clw-black/25 bg-clw-white px-6 py-5 text-xl text-clw-black" />
      <select name="topic" required defaultValue="" className="h-14 w-full border border-clw-black/25 bg-clw-white px-6 text-lg text-clw-black">
        <option value="" disabled>Select a topic</option>
        <option value="Donation">Donation</option>
        <option value="Booster Club">Booster Club</option>
        <option value="Corporate Sponsorship">Corporate Sponsorship</option>
        <option value="Volunteer">Volunteer</option>
        <option value="General Question">General Question</option>
      </select>
      <Textarea name="message" required minLength={10} rows={6} placeholder="How can we help?" className="border-clw-black/25 bg-clw-white px-6 py-5 text-xl text-clw-black" />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="border border-emerald-600/30 bg-emerald-50 p-4 text-sm text-emerald-800">Your message was sent to the Wizards.</p>}

      <Button type="submit" disabled={loading} className="h-16 w-full rounded-none bg-clw-black font-display text-2xl uppercase tracking-wide text-clw-gold hover:bg-clw-gold hover:text-clw-black">
        {loading ? 'Sending...' : 'Submit Inquiry'}
      </Button>
    </form>
  )
}
