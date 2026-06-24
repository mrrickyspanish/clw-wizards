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
