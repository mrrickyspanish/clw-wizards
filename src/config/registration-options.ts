/**
 * Answer choices for the registration form's dropdowns.
 *
 * The club's Google Form (docs/annual-registration-form.md) drives these. The
 * season commitment list is transcribed from the live form; the rest are the
 * club's chosen defaults, confirmed rather than copied, because the underlying
 * questions have obvious answer sets.
 *
 * Stored as free text in the database rather than enums: the club can revise a
 * list without a migration, and a past enrollment keeps the answer it was
 * actually given even after the list changes underneath it.
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

// A plain count, 0 through 10. Stored as the digit so the club can sort and
// filter on it without parsing prose.
export const YEARS_EXPERIENCE = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

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

export const COACH_INTEREST_OPTIONS = ['Yes', 'No'] as const

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
