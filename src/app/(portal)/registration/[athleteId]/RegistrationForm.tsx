'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

import { submitRegistration } from '../actions'
import { ageOnDecember31 } from '@/lib/registration-schema'
import {
  COACH_INTEREST_OPTIONS,
  GUARDIAN_RELATIONSHIPS,
  REFERRAL_SOURCES,
  SEASON_COMMITMENT_OPTIONS,
  SHIRT_SIZES,
  YEARS_EXPERIENCE,
} from '@/config/registration-options'
import type { Athlete, AthleteGuardian, Disclosure, Profile, SeasonEnrollment } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STEPS = ['Wrestler', 'Parents', 'Agreements', 'Review'] as const

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
            {i < STEPS.length - 1 && <span className={`mx-3 h-px flex-1 ${done ? 'bg-clw-gold' : 'bg-clw-gold/20'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

type GuardianDraft = {
  ordinal: 1 | 2
  name: string
  relationship: string
  phone: string
  email: string
  coach_interest: string
}

function emptyGuardian(ordinal: 1 | 2): GuardianDraft {
  return { ordinal, name: '', relationship: '', phone: '', email: '', coach_interest: '' }
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function RegistrationForm({
  seasonRegistrationId,
  seasonLabel,
  seasonYear,
  athlete,
  profile,
  enrollment,
  guardians: existingGuardians,
  disclosures,
}: {
  seasonRegistrationId: string
  seasonLabel: string
  seasonYear: number
  athlete: Athlete
  profile: Profile | null
  enrollment: SeasonEnrollment | null
  guardians: AthleteGuardian[]
  disclosures: Disclosure[]
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [streetAddress, setStreetAddress] = useState(profile?.street_address ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? 'IL')
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '')

  const [referralSource, setReferralSource] = useState(athlete.referral_source ?? '')
  const [grade, setGrade] = useState(enrollment?.grade ?? '')
  const [school, setSchool] = useState(enrollment?.school ?? '')
  const [weight, setWeight] = useState(enrollment?.weight_lbs != null ? String(enrollment.weight_lbs) : '')
  const [shirtSize, setShirtSize] = useState(enrollment?.shirt_size ?? athlete.shirt_size ?? '')
  const [yearsExperience, setYearsExperience] = useState(enrollment?.years_experience ?? '')
  const [commitments, setCommitments] = useState<string[]>(enrollment?.season_commitments ?? [])

  const [guardians, setGuardians] = useState<GuardianDraft[]>(() => {
    const first = existingGuardians.find((guardian) => guardian.ordinal === 1)
    const second = existingGuardians.find((guardian) => guardian.ordinal === 2)
    const toDraft = (guardian: AthleteGuardian): GuardianDraft => ({
      ordinal: guardian.ordinal,
      name: guardian.name,
      relationship: guardian.relationship ?? '',
      phone: guardian.phone ?? '',
      email: guardian.email ?? '',
      coach_interest: guardian.coach_interest ?? '',
    })
    // A brand new family starts with the account holder's own name filled in,
    // since they are almost always guardian 1.
    const firstDraft = first
      ? toDraft(first)
      : { ...emptyGuardian(1), name: profile?.full_name ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '' }
    return second ? [firstDraft, toDraft(second)] : [firstDraft]
  })

  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState<Record<string, boolean>>({})

  const age = ageOnDecember31(athlete.date_of_birth, seasonYear)
  const athleteName = `${athlete.first_name} ${athlete.last_name}`

  function updateGuardian(ordinal: 1 | 2, patch: Partial<GuardianDraft>) {
    setGuardians((current) => current.map((row) => (row.ordinal === ordinal ? { ...row, ...patch } : row)))
  }

  function toggleCommitment(option: string) {
    setCommitments((current) =>
      current.includes(option) ? current.filter((value) => value !== option) : [...current, option]
    )
  }

  const wrestlerValid = Boolean(
    phone.trim() && streetAddress.trim() && city.trim() && grade.trim() && school.trim() && weight.trim() &&
      Number(weight) > 0 && shirtSize && yearsExperience
  )
  const guardiansValid = Boolean(guardians[0]?.name.trim())
  const requiredDisclosures = disclosures.filter((disclosure) => disclosure.required)
  const agreementsValid = requiredDisclosures.every(
    (disclosure) =>
      agreed[disclosure.id] && (!disclosure.requires_signature || signatures[disclosure.id]?.trim())
  )

  const stepValid = [wrestlerValid, guardiansValid, agreementsValid, true][step]

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const result = await submitRegistration({
      seasonRegistrationId,
      athleteId: athlete.id,
      phone,
      street_address: streetAddress,
      city,
      state,
      postal_code: postalCode,
      referral_source: referralSource,
      grade,
      school,
      weight_lbs: weight,
      shirt_size: shirtSize,
      years_experience: yearsExperience,
      season_commitments: commitments,
      guardians: guardians
        .filter((guardian) => guardian.name.trim())
        .map((guardian) => ({
          ordinal: guardian.ordinal,
          name: guardian.name,
          relationship: guardian.relationship,
          phone: guardian.phone,
          email: guardian.email,
          coach_interest: guardian.coach_interest,
        })),
      acceptances: disclosures
        .filter((disclosure) => agreed[disclosure.id])
        .map((disclosure) => ({
          disclosureId: disclosure.id,
          signature: signatures[disclosure.id] ?? profile?.full_name ?? '',
        })),
    })

    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/registration')
    router.refresh()
  }

  return (
    <div>
      <Stepper current={step} />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 0 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-clw-gold/10 bg-clw-black p-4">
            <p className="text-base text-clw-white">{athleteName}</p>
            <p className="mt-1 text-sm text-clw-gray">
              Born {athlete.date_of_birth}
              {age != null && ` · Age ${age} as of 12/31/${String(seasonYear).slice(2)}`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grade for the season" htmlFor="grade">
              <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="6th" />
            </Field>
            <Field label="School attending" htmlFor="school">
              <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} />
            </Field>
            <Field label="Current weight (lbs)" htmlFor="weight">
              <Input
                id="weight"
                type="number"
                min="1"
                step="0.1"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Field>
            <Field label="Shirt size" htmlFor="shirt_size">
              <Select value={shirtSize} onValueChange={setShirtSize}>
                <SelectTrigger id="shirt_size">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {SHIRT_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Years of wrestling experience" htmlFor="years_experience">
              <Select value={yearsExperience} onValueChange={setYearsExperience}>
                <SelectTrigger id="years_experience">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_EXPERIENCE.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="How did you hear about the club?" htmlFor="referral_source">
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger id="referral_source">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-clw-gold/10 bg-clw-black p-4">
            <legend className="px-1 text-base font-medium text-clw-white">Season &amp; state series commitments</legend>
            {SEASON_COMMITMENT_OPTIONS.map((option) => (
              <label key={option} className="flex items-start gap-3 text-base text-clw-gray">
                <Checkbox
                  className="mt-0.5"
                  checked={commitments.includes(option)}
                  onCheckedChange={() => toggleCommitment(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number" htmlFor="phone">
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Street address" htmlFor="street_address">
              <Input id="street_address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" htmlFor="state">
                <Input id="state" maxLength={40} value={state} onChange={(e) => setState(e.target.value)} />
              </Field>
              <Field label="ZIP" htmlFor="postal_code">
                <Input id="postal_code" maxLength={12} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-base leading-relaxed text-clw-gray">
            The club contacts these people about practices, tournaments, and anything urgent during a session. A second
            parent or guardian is optional.
          </p>

          {guardians.map((guardian) => (
            <div key={guardian.ordinal} className="space-y-4 rounded-xl border border-clw-gold/10 bg-clw-black p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-clw-white">
                  Parent / Guardian {guardian.ordinal}
                  {guardian.ordinal === 2 && <span className="ml-2 text-sm text-clw-gray">(optional)</span>}
                </p>
                {guardian.ordinal === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-clw-gray hover:text-red-400"
                    onClick={() => setGuardians((current) => current.filter((row) => row.ordinal !== 2))}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor={`guardian_name_${guardian.ordinal}`}>
                  <Input
                    id={`guardian_name_${guardian.ordinal}`}
                    value={guardian.name}
                    onChange={(e) => updateGuardian(guardian.ordinal, { name: e.target.value })}
                  />
                </Field>
                <Field label="Relationship to wrestler" htmlFor={`guardian_relationship_${guardian.ordinal}`}>
                  <Select
                    value={guardian.relationship}
                    onValueChange={(value) => updateGuardian(guardian.ordinal, { relationship: value })}
                  >
                    <SelectTrigger id={`guardian_relationship_${guardian.ordinal}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {GUARDIAN_RELATIONSHIPS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phone" htmlFor={`guardian_phone_${guardian.ordinal}`}>
                  <Input
                    id={`guardian_phone_${guardian.ordinal}`}
                    type="tel"
                    value={guardian.phone}
                    onChange={(e) => updateGuardian(guardian.ordinal, { phone: e.target.value })}
                  />
                </Field>
                <Field label="Email" htmlFor={`guardian_email_${guardian.ordinal}`}>
                  <Input
                    id={`guardian_email_${guardian.ordinal}`}
                    type="email"
                    value={guardian.email}
                    onChange={(e) => updateGuardian(guardian.ordinal, { email: e.target.value })}
                  />
                </Field>
                <Field label="Interested in coaching?" htmlFor={`guardian_coach_${guardian.ordinal}`}>
                  <Select
                    value={guardian.coach_interest}
                    onValueChange={(value) => updateGuardian(guardian.ordinal, { coach_interest: value })}
                  >
                    <SelectTrigger id={`guardian_coach_${guardian.ordinal}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {COACH_INTEREST_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          ))}

          {guardians.length === 1 && (
            <Button type="button" variant="outline" onClick={() => setGuardians((current) => [...current, emptyGuardian(2)])}>
              Add a second parent or guardian
            </Button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {disclosures.length === 0 && (
            <p className="text-base text-clw-gray">There are no agreements to sign for this season.</p>
          )}

          {disclosures.map((disclosure) => (
            <div key={disclosure.id} className="space-y-4 rounded-xl border border-clw-gold/10 bg-clw-black p-4">
              <div>
                <h2 className="font-display text-2xl text-clw-white">
                  {seasonLabel} {disclosure.title}
                </h2>
                <p className="mt-1 text-sm text-clw-gray">
                  Version {disclosure.version}
                  {disclosure.required ? ' · required' : ' · optional'}
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-clw-gold/10 bg-clw-black-2 p-4">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-clw-gray">{disclosure.body}</p>
              </div>

              <label className="flex items-start gap-3 text-base leading-relaxed text-clw-white">
                <Checkbox
                  className="mt-1"
                  checked={Boolean(agreed[disclosure.id])}
                  onCheckedChange={(checked) =>
                    setAgreed((current) => ({ ...current, [disclosure.id]: checked === true }))
                  }
                />
                <span>{disclosure.agreement_label}</span>
              </label>

              {disclosure.requires_signature && (
                <Field label="Type your full name to sign" htmlFor={`signature_${disclosure.id}`}>
                  <Input
                    id={`signature_${disclosure.id}`}
                    value={signatures[disclosure.id] ?? ''}
                    onChange={(e) =>
                      setSignatures((current) => ({ ...current, [disclosure.id]: e.target.value }))
                    }
                    placeholder={profile?.full_name ?? 'Parent or guardian name'}
                  />
                </Field>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <p className="text-base leading-relaxed text-clw-gray">
            Check everything below, then submit {athlete.first_name} for {seasonLabel}. Dues are created once the
            registration is submitted, and you can pay right away or later.
          </p>

          <dl className="space-y-3 rounded-xl border border-clw-gold/10 bg-clw-black p-4 text-base">
            {[
              ['Wrestler', athleteName],
              ['Age as of 12/31', age != null ? String(age) : '—'],
              ['Grade', grade],
              ['School', school],
              ['Current weight', weight ? `${weight} lbs` : '—'],
              ['Shirt size', shirtSize],
              ['Experience', yearsExperience],
              ['Commitments', commitments.length ? commitments.join(', ') : 'None selected'],
              ['Phone', phone],
              ['Address', [streetAddress, city, state, postalCode].filter(Boolean).join(', ')],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2">
                <dt className="text-clw-gray">{label}</dt>
                <dd className="text-clw-white">{value || '—'}</dd>
              </div>
            ))}
          </dl>

          {guardians
            .filter((guardian) => guardian.name.trim())
            .map((guardian) => (
              <div key={guardian.ordinal} className="rounded-xl border border-clw-gold/10 bg-clw-black p-4 text-base">
                <p className="text-clw-white">
                  Parent / Guardian {guardian.ordinal}: {guardian.name}
                </p>
                <p className="mt-1 text-sm text-clw-gray">
                  {[guardian.relationship, guardian.phone, guardian.email].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
            ))}

          {disclosures
            .filter((disclosure) => agreed[disclosure.id])
            .map((disclosure) => (
              <div key={disclosure.id} className="rounded-xl border border-clw-gold/10 bg-clw-black p-4 text-base">
                <p className="text-clw-white">
                  {disclosure.title} — signed by {signatures[disclosure.id] || profile?.full_name || 'guardian'}
                </p>
              </div>
            ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-clw-gold/10 pt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0 || loading}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!stepValid} onClick={() => setStep((current) => current + 1)}>
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Submitting…' : `Submit ${athlete.first_name}'s registration`}
          </Button>
        )}
      </div>
    </div>
  )
}
