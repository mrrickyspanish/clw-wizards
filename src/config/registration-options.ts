/**
 * Answer choices for the registration form's dropdowns.
 *
 * The club's Google Form (docs/annual-registration-form.md) drives these, but
 * its option lists were not captured when the questions were transcribed. The
 * values below are reasonable stand-ins so the flow is usable end to end --
 * replace them with the club's real lists and the rest of the form keeps
 * working, since nothing branches on specific values.
 *
 * Stored as free text in the database rather than enums for exactly that
 * reason: the club can revise a list without a migration, and a past
 * enrollment keeps the answer it was actually given.
 */

export const SHIRT_SIZES = [
  'Youth XS',
  'Youth S',
  'Youth M',
  'Youth L',
  'Youth XL',
  'Adult S',
  'Adult M',
  'Adult L',
  'Adult XL',
  'Adult 2XL',
] as const

export const YEARS_EXPERIENCE = [
  'First year',
  '1 year',
  '2 years',
  '3 years',
  '4 years',
  '5 or more years',
] as const

export const REFERRAL_SOURCES = [
  'Current Wizards family',
  'Coach or school',
  'Facebook',
  'Website or search',
  'Flier or event',
  'Other',
] as const

export const GUARDIAN_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Stepmother',
  'Stepfather',
  'Grandparent',
  'Legal guardian',
  'Other',
] as const

export const COACH_INTEREST_OPTIONS = ['Yes', 'No', 'Maybe — tell me more'] as const

// The one question whose intent could not be inferred from the form text alone.
// These are placeholders; the club's real commitment options should replace
// them before this ships to families.
export const SEASON_COMMITMENT_OPTIONS = [
  'Regular season tournaments',
  'IKWF State Series',
  'Dual team competition',
  'Practice only — no competition',
] as const
