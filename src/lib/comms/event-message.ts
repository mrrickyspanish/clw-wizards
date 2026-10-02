// Pre-filled text for a message about a club event: the admin picks the event
// in Communications and edits from here.

export type EventOption = {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
}

// '18:30' -> '6:30 PM'
function formatTime(value: string | null): string | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h)) return value
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${suffix}`
}

// '2026-10-10' -> 'Saturday, October 10'. Parsed as a calendar date, not an
// instant, so the day never shifts with the viewer's time zone.
export function formatEventDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** The details block an event message starts from; the admin edits from here. */
export function eventMessage(event: EventOption): { subject: string; body: string } {
  const start = formatTime(event.start_time)
  const end = formatTime(event.end_time)
  const when = [formatEventDate(event.date), start ? (end ? `${start} – ${end}` : start) : null]
    .filter(Boolean)
    .join(', ')
  const lines = [`${event.title}`, `When: ${when}`]
  if (event.location) lines.push(`Where: ${event.location}`)
  if (event.notes) lines.push('', event.notes)
  return { subject: `${event.title}: ${formatEventDate(event.date)}`, body: lines.join('\n') }
}
