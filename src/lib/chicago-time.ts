export const TIMEZONE = 'America/Chicago'

/**
 * Today's date as YYYY-MM-DD in Chicago time, DST-safe via Intl — never use
 * moment.js or a manual UTC offset (the offset flips with DST).
 */
export function chicagoDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

export function chicagoDatePlusDays(days: number, now: Date = new Date()): string {
  const todayParts = chicagoDateString(now).split('-').map(Number)
  const utcMidnight = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]))
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + days)
  return utcMidnight.toISOString().slice(0, 10)
}

export function chicagoHour(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  return Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
}

/** Day of week in Chicago time: 0 = Sunday ... 6 = Saturday. */
export function chicagoWeekday(now: Date = new Date()): number {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(now)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short)
}

/** Minutes since midnight in Chicago time (DST-safe). */
export function chicagoMinutesSinceMidnight(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h * 60 + m
}
