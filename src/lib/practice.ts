import { chicagoWeekday, chicagoMinutesSinceMidnight, chicagoDatePlusDays } from '@/lib/chicago-time'
import type { Practice } from '@/types/database'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** 'HH:MM' (24h) -> '6:30 PM'. Returns the input unchanged if unparseable. */
export function formatTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return hhmm
  let h = Number(m[1])
  const min = m[2]
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${min} ${period}`
}

function startMinutes(p: Pick<Practice, 'start_time'>): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(p.start_time.trim())
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

export type NextPractice = { practice: Practice; label: string }

/**
 * Soonest upcoming occurrence among the given practices, computed from
 * (weekday, start_time) in Chicago time. `label` is a human "when": Today,
 * Tomorrow, or the weekday name.
 */
/**
 * @param cancelled Set of cancelled occurrences keyed `${practiceId}|YYYY-MM-DD`
 *   (Chicago date). A practice whose next occurrence is cancelled rolls forward
 *   a week, so a holiday closure never surfaces as the next practice.
 */
export function nextPractice(
  practices: Practice[],
  now: Date = new Date(),
  cancelled: Set<string> = new Set()
): NextPractice | null {
  if (!practices.length) return null
  const todayDow = chicagoWeekday(now)
  const nowMin = chicagoMinutesSinceMidnight(now)

  let best: { practice: Practice; minutesAway: number; daysAway: number } | null = null
  for (const p of practices) {
    let days = (p.weekday - todayDow + 7) % 7
    // Same day but already started -> next week.
    if (days === 0 && startMinutes(p) <= nowMin) days = 7
    // Roll past any cancelled occurrences (cap ~1 year of lookahead).
    let guard = 0
    while (cancelled.has(`${p.id}|${chicagoDatePlusDays(days, now)}`) && guard < 60) {
      days += 7
      guard += 1
    }
    const minutesAway = days * 24 * 60 + (startMinutes(p) - nowMin)
    if (!best || minutesAway < best.minutesAway) {
      best = { practice: p, minutesAway, daysAway: days }
    }
  }
  if (!best) return null

  const label = best.daysAway === 0 ? 'Today' : best.daysAway === 1 ? 'Tomorrow' : WEEKDAYS[best.practice.weekday]
  return { practice: best.practice, label }
}
