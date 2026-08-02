import { z } from 'zod'

import { ORG } from '@/config/org.config'

/**
 * The one definition of a wrestler's shape, shared by onboarding, the standalone
 * add-athlete form, and season registration. These three used to carry
 * byte-identical copies of this schema, which was going to drift the moment a
 * field was added.
 */
export const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth is required'),
  practice_group: z.enum(ORG.practiceGroups as unknown as [string, ...string[]]),
  weight_class: z.string().trim().optional().nullable(),
  usa_wrestling_card_number: z.string().trim().optional().nullable(),
  shirt_size: z.string().trim().optional().nullable(),
})

export type AthleteInput = z.input<typeof athleteSchema>

// Guardian 1 is required; guardian 2 is optional. The club's Google Form marks
// both required, which locks out single-guardian households -- see
// docs/annual-registration-form.md.
export const guardianSchema = z.object({
  ordinal: z.union([z.literal(1), z.literal(2)]),
  name: z.string().trim().min(1, 'Guardian name is required').max(120),
  relationship: z.string().trim().max(60).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email('Enter a valid guardian email').max(160).optional().nullable().or(z.literal('')),
  coach_interest: z.string().trim().max(60).optional().nullable(),
})

export const registrationSchema = z.object({
  seasonRegistrationId: z.string().uuid(),
  athleteId: z.string().uuid(),

  // Household contact, saved back to the parent's profile.
  phone: z.string().trim().min(1, 'A phone number is required').max(20),
  street_address: z.string().trim().min(1, 'A street address is required').max(200),
  city: z.string().trim().min(1, 'A city is required').max(80),
  state: z.string().trim().max(40).optional().nullable(),
  postal_code: z.string().trim().max(12).optional().nullable(),

  // Asked once and kept on the athlete record.
  referral_source: z.string().trim().max(80).optional().nullable(),

  // Re-confirmed every season.
  grade: z.string().trim().min(1, 'Grade is required').max(40),
  school: z.string().trim().min(1, 'School is required').max(160),
  weight_lbs: z.coerce.number().positive('Enter the wrestler’s current weight').max(600),
  shirt_size: z.string().trim().min(1, 'Shirt size is required').max(40),
  years_experience: z.string().trim().min(1, 'Years of experience is required').max(40),
  season_commitments: z.array(z.string().trim().max(80)).default([]),

  guardians: z.array(guardianSchema).min(1, 'At least one parent or guardian is required'),

  // One entry per active required disclosure, each with the guardian's typed
  // signature. The database refuses the submission if any are missing, so this
  // is the client's half of the same rule.
  acceptances: z
    .array(
      z.object({
        disclosureId: z.string().uuid(),
        signature: z.string().trim().min(1, 'Type your full name to sign'),
      })
    )
    .default([]),
})

export type RegistrationInput = z.input<typeof registrationSchema>

/**
 * The wrestler's age on December 31 of the season's year -- the figure the
 * club's form asks families to work out by hand. Derived here so it can never
 * contradict the date of birth it came from.
 */
export function ageOnDecember31(dateOfBirth: string, year: number): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)
  if (!match) return null
  const birthYear = Number(match[1])
  return year - birthYear
}
