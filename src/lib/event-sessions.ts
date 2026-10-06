import { formatTime } from '@/lib/practice'
import { formatAgeDivisions, type AgeDivision } from '@/lib/age-division'
import type { EventSession } from '@/types/database'

/** "Tot, Bantam · 9:00 AM – 10:30 AM" */
export function sessionLine(session: Pick<EventSession, 'start_time' | 'end_time' | 'age_divisions'>): string {
  const time = `${formatTime(session.start_time)}${session.end_time ? ` – ${formatTime(session.end_time)}` : ''}`
  return `${formatAgeDivisions(session.age_divisions)} · ${time}`
}

/** The session a wrestler in `division` attends, if the event lists one. */
export function sessionFor<T extends Pick<EventSession, 'age_divisions'>>(sessions: T[], division: AgeDivision | null): T | null {
  if (!division) return null
  return sessions.find((s) => s.age_divisions.includes(division)) ?? null
}

/** Sessions grouped by event, in session order. */
export function sessionsByEvent<T extends Pick<EventSession, 'event_id' | 'sort_order'>>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of [...rows].sort((a, b) => a.sort_order - b.sort_order)) {
    map.set(row.event_id, [...(map.get(row.event_id) ?? []), row])
  }
  return map
}
