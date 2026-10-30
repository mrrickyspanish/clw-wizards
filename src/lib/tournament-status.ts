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
