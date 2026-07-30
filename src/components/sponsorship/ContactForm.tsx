'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type ContactFormProps = {
  defaultTopic?: string
  hideTopic?: boolean
  submitLabel?: string
}

export function ContactForm({
  defaultTopic = '',
  hideTopic = false,
  submitLabel = 'Submit Inquiry',
}: ContactFormProps = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError(null)
    setSuccess(false)
    setLoading(true)

    const form = new FormData(formElement)
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

      formElement.reset()
      setSuccess(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const inputClassName = 'h-12 border-clw-black/25 bg-clw-white px-4 text-base text-clw-black sm:h-14 sm:px-6 sm:text-xl'

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 sm:mt-10 sm:space-y-6">
      <div className="hidden" aria-hidden>
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <Input name="firstName" required placeholder="First name" className={inputClassName} />
        <Input name="lastName" required placeholder="Last name" className={inputClassName} />
      </div>
      <Input name="email" type="email" required placeholder="Email" className={inputClassName} />

      {hideTopic ? (
        <input type="hidden" name="topic" value={defaultTopic || 'General Question'} />
      ) : (
        <select
          name="topic"
          required
          defaultValue={defaultTopic}
          className="h-12 w-full border border-clw-black/25 bg-clw-white px-4 text-base text-clw-black sm:h-14 sm:px-6 sm:text-lg"
        >
          <option value="" disabled>Select a topic</option>
          <option value="Donation">Donation</option>
          <option value="Booster Club">Booster Club</option>
          <option value="Corporate Sponsorship">Corporate Sponsorship</option>
          <option value="Volunteer">Volunteer</option>
          <option value="General Question">General Question</option>
        </select>
      )}

      <Textarea name="message" required minLength={10} rows={4} placeholder="Tell us how you would like to help." className="border-clw-black/25 bg-clw-white px-4 py-4 text-base text-clw-black sm:px-6 sm:py-5 sm:text-xl" />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="border border-emerald-600/30 bg-emerald-50 p-4 text-sm text-emerald-800">Your message was sent to the Wizards.</p>}

      <Button type="submit" disabled={loading} className="h-14 w-full rounded-none bg-clw-black font-display text-xl uppercase tracking-wide text-clw-gold hover:bg-clw-gold hover:text-clw-black sm:h-16 sm:text-2xl">
        {loading ? 'Sending...' : submitLabel}
      </Button>
    </form>
  )
}
