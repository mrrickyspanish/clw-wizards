import { chicagoWeekday, chicagoMinutesSinceMidnight, chicagoDatePlusDays, chicagoDateString } from '@/lib/chicago-time'
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

/**
 * The practice season the add-practice form starts from. A new practice
 * defaults to these dates so it cannot show before the season; an admin can
 * change or clear them per practice. Update each season.
 */
export const PRACTICE_SEASON = { starts_on: '2026-11-01', ends_on: '2027-03-15' } as const

/** 'YYYY-MM-DD' -> 'Sun, Nov 1'. Read as a calendar date, so no time zone can shift the day. */
export function formatPracticeDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function calendarDays(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Has this practice's series already ended? (Its last day is before `today`.) */
export function practiceEnded(p: Pick<Practice, 'ends_on'>, today: string = chicagoDateString()): boolean {
  return Boolean(p.ends_on && p.ends_on < today)
}

/** Has this practice's series not started yet? (Its first day is after `today`.) */
export function practiceNotStarted(p: Pick<Practice, 'starts_on'>, today: string = chicagoDateString()): boolean {
  return Boolean(p.starts_on && p.starts_on > today)
}

/** 'Starts Sun, Nov 1' / 'Ended Mar 15' / '' for what to show beside a practice's time. */
export function practiceDateNote(p: Pick<Practice, 'starts_on' | 'ends_on'>, today: string = chicagoDateString()): string {
  if (practiceNotStarted(p, today)) return `Starts ${formatPracticeDate(p.starts_on!)}`
  return ''
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
  const today = chicagoDateString(now)

  let best: { practice: Practice; minutesAway: number; daysAway: number } | null = null
  for (const p of practices) {
    let days = (p.weekday - todayDow + 7) % 7
    // Same day but already started -> next week.
    if (days === 0 && startMinutes(p) <= nowMin) days = 7
    // Not before the series starts: skip ahead in whole weeks to its first
    // matching day.
    if (p.starts_on) {
      const untilStart = calendarDays(p.starts_on) - calendarDays(today)
      if (untilStart > days) days += Math.ceil((untilStart - days) / 7) * 7
    }
    // Roll past any cancelled occurrences (cap ~1 year of lookahead).
    let guard = 0
    while (cancelled.has(`${p.id}|${chicagoDatePlusDays(days, now)}`) && guard < 60) {
      days += 7
      guard += 1
    }
    // Not after the series ends.
    if (p.ends_on && chicagoDatePlusDays(days, now) > p.ends_on) continue
    const minutesAway = days * 24 * 60 + (startMinutes(p) - nowMin)
    if (!best || minutesAway < best.minutesAway) {
      best = { practice: p, minutesAway, daysAway: days }
    }
  }
  if (!best) return null

  // A weekday name only reads right inside the coming week; further out, a
  // practice that starts later in the season needs its date.
  const label =
    best.daysAway === 0
      ? 'Today'
      : best.daysAway === 1
        ? 'Tomorrow'
        : best.daysAway < 7
          ? WEEKDAYS[best.practice.weekday]
          : formatPracticeDate(chicagoDatePlusDays(best.daysAway, now))
  return { practice: best.practice, label }
}

export type PracticeDay = { date: string; sessions: Practice[] }

/**
 * Who practices on a day, for a calendar title: "Group 1", "Groups 1 & 3",
 * "Groups 1, 2 & 4". Groups not named "Group N" are listed as they are.
 */
export function practiceGroupsTitle(groups: string[]): string {
  const unique = [...new Set(groups.map((g) => g.trim()).filter(Boolean))]
  if (unique.length === 0) return 'Practice'
  if (unique.length === 1) return unique[0]
  const numbered = unique.map((g) => /^Group\s+(\S+)$/i.exec(g)?.[1])
  const parts = numbered.every(Boolean) ? (numbered as string[]) : unique
  const list = `${parts.slice(0, -1).join(', ')} & ${parts.at(-1)}`
  return numbered.every(Boolean) ? `Groups ${list}` : list
}

/**
 * Every date from `from` through `to` (YYYY-MM-DD, inclusive) that has
 * practice, with that day's practices in start order. Honors each practice's
 * first and last day and any cancelled occurrence (`${practiceId}|YYYY-MM-DD`).
 * Read as calendar dates, so no time zone can shift a day.
 */
export function practiceDays(
  practices: Practice[],
  from: string,
  to: string,
  cancelled: Set<string> = new Set()
): PracticeDay[] {
  const days: PracticeDay[] = []
  const live = practices.filter((p) => p.active !== false)
  if (!live.length) return days
  for (let day = calendarDays(from); day <= calendarDays(to); day += 1) {
    const at = new Date(day * 86_400_000)
    const date = at.toISOString().slice(0, 10)
    const sessions = live
      .filter(
        (p) =>
          p.weekday === at.getUTCDay() &&
          (!p.starts_on || p.starts_on <= date) &&
          (!p.ends_on || p.ends_on >= date) &&
          !cancelled.has(`${p.id}|${date}`)
      )
      .sort((a, b) => startMinutes(a) - startMinutes(b))
    if (sessions.length) days.push({ date, sessions })
  }
  return days
}

export type ScheduleLine = { title: string; groups: string[]; start_time: string; end_time: string | null; location: string }
export type ScheduleDay = {
  date: string
  // Who practices, one line per time slot ("Groups 2 & 3 · 6:00 PM – 7:30 PM").
  lines: ScheduleLine[]
  // Set when practice that would have been on this day is off.
  off: { groups: string[]; reason: string | null } | null
  // Anything the club wrote on that day's practices ("Regional wrestlers").
  notes: string[]
}

/**
 * The practice schedule day by day, the way Tony writes it (Oct 30): every
 * date from `from` through `to` that has practice or had practice called off,
 * with groups that share a time on one line. `groups` limits it to those
 * practice groups (a family's own). Read as calendar dates, so no time zone
 * can shift a day.
 */
export function practiceSchedule(
  practices: Practice[],
  cancellations: { practice_id: string; date: string; reason: string | null }[],
  from: string,
  to: string,
  groups?: Set<string>
): ScheduleDay[] {
  const live = practices.filter((p) => p.active !== false && (!groups || groups.has(p.practice_group)))
  const offByKey = new Map(cancellations.map((c) => [`${c.practice_id}|${c.date}`, c]))
  const days: ScheduleDay[] = []
  for (let day = calendarDays(from); day <= calendarDays(to); day += 1) {
    const at = new Date(day * 86_400_000)
    const date = at.toISOString().slice(0, 10)
    const scheduled = live
      .filter((p) => p.weekday === at.getUTCDay() && (!p.starts_on || p.starts_on <= date) && (!p.ends_on || p.ends_on >= date))
      .sort((a, b) => startMinutes(a) - startMinutes(b) || a.practice_group.localeCompare(b.practice_group))
    if (!scheduled.length) continue
    const running = scheduled.filter((p) => !offByKey.has(`${p.id}|${date}`))
    const called = scheduled.filter((p) => offByKey.has(`${p.id}|${date}`))
    const slots = new Map<string, Practice[]>()
    for (const p of running) {
      const key = `${p.start_time}|${p.end_time ?? ''}|${p.location}`
      slots.set(key, [...(slots.get(key) ?? []), p])
    }
    const reasons = [...new Set(called.map((p) => offByKey.get(`${p.id}|${date}`)?.reason?.trim()).filter(Boolean))]
    days.push({
      date,
      lines: [...slots.values()].map((slot) => ({
        title: practiceGroupsTitle(slot.map((p) => p.practice_group)),
        groups: slot.map((p) => p.practice_group),
        start_time: slot[0].start_time,
        end_time: slot[0].end_time,
        location: slot[0].location,
      })),
      off: called.length ? { groups: [...new Set(called.map((p) => p.practice_group))], reason: reasons.join(' · ') || null } : null,
      notes: [...new Set(running.map((p) => p.notes?.trim()).filter((n): n is string => Boolean(n)))],
    })
  }
  return days
}

/** The last day any practice runs, or 16 weeks out when none has an end. */
export function practiceSeasonEnd(practices: Pick<Practice, 'ends_on' | 'active'>[], today: string = chicagoDateString()): string {
  const ends = practices.filter((p) => p.active !== false).map((p) => p.ends_on)
  if (!ends.length) return today
  if (ends.some((e) => !e)) return chicagoDatePlusDays(16 * 7, new Date(`${today}T12:00:00Z`))
  return (ends as string[]).reduce((a, b) => (b > a ? b : a), today)
}
