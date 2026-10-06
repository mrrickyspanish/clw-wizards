import { PRACTICE_SEASON } from '@/lib/practice'

// IKWF age divisions, youngest first.
export const AGE_DIVISIONS = ['tot', 'bantam', 'intermediate', 'novice', 'senior'] as const
export type AgeDivision = (typeof AGE_DIVISIONS)[number]

export const AGE_DIVISION_LABELS: Record<AgeDivision, string> = {
  tot: 'Tot',
  bantam: 'Bantam',
  intermediate: 'Intermediate',
  novice: 'Novice',
  senior: 'Senior',
}

// The season a division is worked out for: ages are as of December 31 of the
// year the season starts.
export const AGE_DIVISION_SEASON_YEAR = Number(PRACTICE_SEASON.starts_on.slice(0, 4))

/**
 * A wrestler's IKWF division from their birthday, for the season starting in
 * `seasonYear`. IKWF's age bands overlap by a year (Bantam is 6-8, Intermediate
 * 8-10, and so on); an age that fits two divisions goes to the younger one, so
 * an 8-year-old (TJ, born Jan 2018) is Bantam. An admin moves a wrestler up
 * with the override on their profile.
 *
 * Age as of Dec 31:  6 and under Tot · 7-8 Bantam · 9-10 Intermediate ·
 * 11-12 Novice · 13-14 Senior. A 15-year-old born September to December is
 * still Senior for club events. Anyone else, or a birthday that cannot be
 * right, has no division.
 */
export function ageDivisionFor(dateOfBirth: string | null | undefined, seasonYear = AGE_DIVISION_SEASON_YEAR): AgeDivision | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dateOfBirth ?? '')
  if (!match) return null
  const age = seasonYear - Number(match[1])
  if (age < 3) return null
  if (age <= 6) return 'tot'
  if (age <= 8) return 'bantam'
  if (age <= 10) return 'intermediate'
  if (age <= 12) return 'novice'
  if (age <= 14) return 'senior'
  if (age === 15 && Number(match[2]) >= 9) return 'senior'
  return null
}

/** The division a wrestler competes in: the admin's override, else their birthday's. */
export function wrestlerAgeDivision(
  athlete: { date_of_birth: string | null; age_division?: string | null },
  seasonYear = AGE_DIVISION_SEASON_YEAR
): AgeDivision | null {
  const override = athlete.age_division
  if (override && (AGE_DIVISIONS as readonly string[]).includes(override)) return override as AgeDivision
  return ageDivisionFor(athlete.date_of_birth, seasonYear)
}

/** "Tot, Bantam" in age order, for a session's division list. */
export function formatAgeDivisions(divisions: readonly string[]): string {
  return AGE_DIVISIONS.filter((d) => divisions.includes(d))
    .map((d) => AGE_DIVISION_LABELS[d])
    .join(', ')
}
