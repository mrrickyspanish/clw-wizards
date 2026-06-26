'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { updateContactPrefs } from './actions'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function ContactPrefsForm({
  initialPhone,
  initialSmsOptIn,
}: {
  initialPhone: string | null
  initialSmsOptIn: boolean
}) {
  const router = useRouter()
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [smsOptIn, setSmsOptIn] = useState(initialSmsOptIn)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateContactPrefs({ phone, smsOptIn })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="smsOptIn"
          checked={smsOptIn}
          onCheckedChange={(checked) => setSmsOptIn(checked === true)}
        />
        <Label htmlFor="smsOptIn" className="text-xs font-normal leading-relaxed text-clw-gray">
          {SMS_CONSENT_TEXT}
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
        {saved && <p className="text-xs text-clw-gold-ink">Saved</p>}
      </div>
    </form>
  )
}
