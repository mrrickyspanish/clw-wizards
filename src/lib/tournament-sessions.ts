import { formatTime } from '@/lib/practice'

/** Tournament session times and divisions (B2). Local types so this file does not depend on the schema task. */
export type TournamentSessionDraft = {
  start_time?: string | null
  divisions?: string | null
}

export type NormalizedTournamentSession = {
  start_time: string
  divisions: string | null
  sort_order: number
}

export type NormalizeSessionsResult =
  | { ok: true; sessions: NormalizedTournamentSession[] }
  | { ok: false; error: string }

export const MAX_TOURNAMENT_SESSIONS = 5
export const MAX_SESSION_DIVISIONS_LENGTH = 120

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** True for a 24-hour 'HH:MM' time, the format the database check expects. */
export function isSessionTime(value: string | null | undefined): value is string {
  return typeof value === 'string' && HHMM.test(value)
}

function cleanDivisions(value: string | null | undefined): string | null {
  const text = (value ?? '').trim().slice(0, MAX_SESSION_DIVISIONS_LENGTH).trim()
  return text || null
}

/**
 * Drops fully empty rows, rejects bad times and more than 5 sessions,
 * trims divisions to 120 characters, and sorts by start time.
 */
export function normalizeSessions(drafts: TournamentSessionDraft[]): NormalizeSessionsResult {
  const rows = drafts
    .map((d) => ({ start_time: (d.start_time ?? '').trim(), divisions: cleanDivisions(d.divisions) }))
    .filter((d) => d.start_time !== '' || d.divisions !== null)
  if (rows.length > MAX_TOURNAMENT_SESSIONS) {
    return { ok: false, error: `Add at most ${MAX_TOURNAMENT_SESSIONS} sessions.` }
  }
  for (const [i, row] of rows.entries()) {
    if (!isSessionTime(row.start_time)) {
      return { ok: false, error: `Session ${i + 1} needs a start time like 08:00.` }
    }
  }
  const sessions = rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row.start_time.localeCompare(b.row.start_time) || a.index - b.index)
    .map(({ row }, sort_order) => ({ start_time: row.start_time, divisions: row.divisions, sort_order }))
  return { ok: true, sessions }
}

/** The earliest valid 'HH:MM' start, or null when there is none. */
export function earliestStart(sessions: Array<{ start_time: string | null | undefined }>): string | null {
  let earliest: string | null = null
  for (const s of sessions) {
    if (isSessionTime(s.start_time) && (earliest === null || s.start_time < earliest)) earliest = s.start_time
  }
  return earliest
}

/** "8:00 AM · 6u, 8u, 10u", or just "8:00 AM" when no divisions are listed. */
export function sessionLine(session: { start_time: string; divisions?: string | null }): string {
  const time = formatTime(session.start_time)
  const divisions = (session.divisions ?? '').trim()
  return divisions ? `${time} · ${divisions}` : time
}
