import type { Tournament } from '@/types/database'

// What each tournament status reads as (not_open added Oct 30, Tyler).
export const TOURNAMENT_STATUS_LABELS: Record<Tournament['status'], string> = {
  open: 'Open',
  not_open: 'Not open yet',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

/** The line shown where a Register button would be when registration isn't open. */
export function registrationLine(status: Tournament['status']): string {
  if (status === 'not_open') return "Registration isn't open yet."
  if (status === 'cancelled') return 'This tournament is cancelled.'
  return 'Registration is closed.'
}

// Where an outside Register link goes, by its web address. The platform setting
// alone can be Other, Internal or blank, which used to print as "Register on
// other" (Nov 20: Capture the Eagle, Wilbur Borrero, Spartan 300).
const REGISTER_SITES: [RegExp, string][] = [
  [/(^|\.)trackwrestling\.com$/, 'TrackWrestling'],
  [/(^|\.)usabracketing\.com$/, 'USA Bracketing'],
  [/(^|\.)flowrestling\.org$/, 'FloWrestling'],
]
const PLATFORM_NAMES: Partial<Record<NonNullable<Tournament['external_platform']>, string>> = {
  trackwrestling: 'TrackWrestling',
  flowrestling: 'FloWrestling',
}

/** The text on a tournament's outside Register button. */
export function registerButtonLabel(platform: Tournament['external_platform'], url: string | null): string {
  let host = ''
  try {
    host = url ? new URL(url).hostname.toLowerCase() : ''
  } catch {
    host = ''
  }
  const site = REGISTER_SITES.find(([rx]) => rx.test(host))?.[1] ?? (platform ? PLATFORM_NAMES[platform] : undefined)
  return site ? `Register on ${site}` : 'Register online'
}
