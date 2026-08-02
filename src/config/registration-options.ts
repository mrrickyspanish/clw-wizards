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

/**
 * The club's real commitment options, transcribed from the live form. This is a
 * single-select: a wrestler declares one path for the year, and the four
 * choices are mutually exclusive by construction.
 *
 * The third option was cut off at the right edge of the screenshot these came
 * from; "Middle School state series" is the reading the other three make
 * inevitable, but confirm it against the form before the season opens.
 */
export const SEASON_COMMITMENT_OPTIONS = [
  'Will wrestle Wizards IKWF during the season and IKWF state series',
  'Will wrestle Wizards IKWF/Middle School during the season & IKWF state series',
  'Will wrestle Wizards IKWF/Middle School during the season and Middle School state series',
  'N/A - this wrestler is not in Middle School',
] as const
