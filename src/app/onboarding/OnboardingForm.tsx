'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

import { completeOnboarding, skipOnboarding } from './actions'
import { SMS_CONSENT_TEXT } from '@/lib/twilio/opt-in'
import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AthleteDraft = {
  key: string
  first_name: string
  last_name: string
  date_of_birth: string
  practice_group: string
  weight_class: string
  usa_wrestling_card_number: string
  shirt_size: string
}

function emptyAthlete(): AthleteDraft {
  return {
    key: crypto.randomUUID(),
    first_name: '',
    last_name: '',
    date_of_birth: '',
    practice_group: ORG.practiceGroups[0],
    weight_class: '',
    usa_wrestling_card_number: '',
    shirt_size: '',
  }
}

export function OnboardingForm({
  initialPhone,
  initialSmsOptIn,
}: {
  initialPhone: string | null
  initialSmsOptIn: boolean
}) {
  const router = useRouter()
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [smsOptIn, setSmsOptIn] = useState(initialSmsOptIn)
  const [athletes, setAthletes] = useState<AthleteDraft[]>([emptyAthlete()])
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateAthlete(key: string, patch: Partial<AthleteDraft>) {
    setAthletes((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeAthlete(key: string) {
    setAthletes((rows) => rows.filter((row) => row.key !== key))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await completeOnboarding({
      phone,
      smsOptIn,
      athletes: athletes.map(({ key: _key, ...rest }) => rest),
    })

    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleSkip() {
    setError(null)
    setSkipping(true)
    const result = await skipOnboarding()
    setSkipping(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-clw-gray">Contact info</h3>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="smsOptIn" checked={smsOptIn} onCheckedChange={(checked) => setSmsOptIn(checked === true)} />
          <Label htmlFor="smsOptIn" className="text-xs font-normal leading-relaxed text-muted-foreground">
            {SMS_CONSENT_TEXT}
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-clw-gray">Athletes</h3>
        {athletes.map((athlete, index) => (
          <div key={athlete.key} className="space-y-4 rounded-md border border-clw-gold/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-clw-gray">Athlete {index + 1}</p>
              {athletes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-clw-gray hover:text-red-400"
                  onClick={() => removeAthlete(athlete.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`first_name_${athlete.key}`}>First name</Label>
                <Input
                  id={`first_name_${athlete.key}`}
                  required
                  value={athlete.first_name}
                  onChange={(e) => updateAthlete(athlete.key, { first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`last_name_${athlete.key}`}>Last name</Label>
                <Input
                  id={`last_name_${athlete.key}`}
                  required
                  value={athlete.last_name}
                  onChange={(e) => updateAthlete(athlete.key, { last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`dob_${athlete.key}`}>Date of birth</Label>
              <Input
                id={`dob_${athlete.key}`}
                type="date"
                required
                value={athlete.date_of_birth}
                onChange={(e) => updateAthlete(athlete.key, { date_of_birth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Practice group</Label>
              <Select
                value={athlete.practice_group}
                onValueChange={(value) => updateAthlete(athlete.key, { practice_group: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG.practiceGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`weight_class_${athlete.key}`}>Weight class</Label>
                <Input
                  id={`weight_class_${athlete.key}`}
                  value={athlete.weight_class}
                  onChange={(e) => updateAthlete(athlete.key, { weight_class: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`shirt_size_${athlete.key}`}>Shirt size</Label>
                <Input
                  id={`shirt_size_${athlete.key}`}
                  value={athlete.shirt_size}
                  onChange={(e) => updateAthlete(athlete.key, { shirt_size: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`card_number_${athlete.key}`}>USA Wrestling card #</Label>
              <Input
                id={`card_number_${athlete.key}`}
                value={athlete.usa_wrestling_card_number}
                onChange={(e) => updateAthlete(athlete.key, { usa_wrestling_card_number: e.target.value })}
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={() => setAthletes((rows) => [...rows, emptyAthlete()])}>
          + Add another athlete
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || skipping}>
          {loading ? 'Saving…' : 'Save & continue'}
        </Button>
        <Button type="button" variant="ghost" disabled={loading || skipping} onClick={handleSkip}>
          {skipping ? 'Skipping…' : 'Skip for now'}
        </Button>
      </div>
    </form>
  )
}
