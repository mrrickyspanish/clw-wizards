'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Check } from 'lucide-react'

import { completeOnboarding, skipOnboarding, redeemFamilyInvite } from './actions'
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

const STEPS = ['Your info', 'Your wrestlers', 'Review'] as const

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  done
                    ? 'border-clw-gold bg-clw-gold text-clw-black'
                    : active
                      ? 'border-clw-gold text-clw-gold'
                      : 'border-clw-gold/20 text-clw-gray'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:inline ${active || done ? 'text-clw-white' : 'text-clw-gray'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`mx-3 h-px flex-1 ${done ? 'bg-clw-gold' : 'bg-clw-gold/20'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function OnboardingForm({
  initialPhone,
  initialSmsOptIn,
}: {
  initialPhone: string | null
  initialSmsOptIn: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [smsOptIn, setSmsOptIn] = useState(initialSmsOptIn)
  const [athletes, setAthletes] = useState<AthleteDraft[]>([emptyAthlete()])
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    setError(null)
    if (!inviteCode.trim()) {
      setError('Enter the invite code your family shared.')
      return
    }
    setJoining(true)
    const result = await redeemFamilyInvite(inviteCode)
    setJoining(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  function updateAthlete(key: string, patch: Partial<AthleteDraft>) {
    setAthletes((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeAthlete(key: string) {
    setAthletes((rows) => rows.filter((row) => row.key !== key))
  }

  // Every athlete needs the required fields before we can advance off the
  // wrestlers step (mirrors the server-side zod schema).
  function athletesValid(): boolean {
    return athletes.every(
      (a) => a.first_name.trim() && a.last_name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(a.date_of_birth)
    )
  }

  function next() {
    setError(null)
    if (step === 1 && !athletesValid()) {
      setError('Each wrestler needs a first name, last name, and date of birth.')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleFinish() {
    setError(null)
    setLoading(true)
    const result = await completeOnboarding({
      phone,
      smsOptIn,
      athletes: athletes.map((a) => ({
        first_name: a.first_name,
        last_name: a.last_name,
        date_of_birth: a.date_of_birth,
        practice_group: a.practice_group,
        weight_class: a.weight_class,
        usa_wrestling_card_number: a.usa_wrestling_card_number,
        shirt_size: a.shirt_size,
      })),
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

  if (mode === 'join') {
    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div>
          <h3 className="font-medium text-clw-white">Join an existing family</h3>
          <p className="mt-1 text-sm text-clw-gray">
            If another guardian already set up your wrestlers, enter the invite code they shared. You&apos;ll co-manage
            the same family — no need to re-add anyone.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite_code">Invite code</Label>
          <Input
            id="invite_code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="ABCD-2345"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode('create')
              setError(null)
            }}
            disabled={joining}
          >
            ← Set up my own
          </Button>
          <Button type="button" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining…' : 'Join family'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Stepper current={step} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* key forces the slide-in animation to replay on each step change */}
      <div key={step} className="animate-step-in">
        {step === 0 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode('join')
                setError(null)
              }}
              className="w-full rounded-md border border-clw-gold/20 bg-clw-gold/5 p-3 text-left text-sm text-clw-gray transition-colors hover:border-clw-gold/40"
            >
              <span className="font-medium text-clw-white">Joining an existing family?</span> Enter an invite code instead →
            </button>
            <p className="text-sm text-clw-gray">How should the club reach you? (You can skip this for now.)</p>
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
        )}

        {step === 1 && (
          <div className="space-y-4">
            {athletes.map((athlete, index) => (
              <div key={athlete.key} className="space-y-4 rounded-md border border-clw-gold/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-clw-white">Wrestler {index + 1}</p>
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
                      value={athlete.first_name}
                      onChange={(e) => updateAthlete(athlete.key, { first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`last_name_${athlete.key}`}>Last name</Label>
                    <Input
                      id={`last_name_${athlete.key}`}
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAthletes((rows) => [...rows, emptyAthlete()])}
            >
              + Add another wrestler
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-clw-gray">Contact</h3>
              <p className="mt-1 text-clw-white">{phone ? phone : 'No phone provided'}</p>
              <p className="text-sm text-clw-gray">
                {smsOptIn ? 'Opted in to SMS updates' : 'Not opted in to SMS'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-clw-gray">Wrestlers ({athletes.length})</h3>
              <ul className="mt-2 space-y-2">
                {athletes.map((a) => (
                  <li key={a.key} className="rounded-md border border-clw-gold/10 p-3">
                    <p className="font-medium text-clw-white">
                      {a.first_name} {a.last_name}
                    </p>
                    <p className="text-sm text-clw-gray">
                      {a.practice_group}
                      {a.date_of_birth && ` · DOB ${a.date_of_birth}`}
                      {a.weight_class && ` · ${a.weight_class}`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={back} disabled={loading || skipping}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step === 0 && (
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading || skipping}>
              {skipping ? 'Skipping…' : 'Skip for now'}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} disabled={loading || skipping}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} disabled={loading || skipping}>
              {loading ? 'Saving…' : 'Finish & go to dashboard'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
