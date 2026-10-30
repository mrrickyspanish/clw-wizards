import { formatTime } from '@/lib/practice'
import type { ClubEvent, ClubEventType, Tournament } from '@/types/database'

// The public Events calendar (Ricky, Oct 30): tournaments and club events
// only. Practices are for signed-in families and live in the parent portal.

const KIND_LABELS: Record<'tournament' | ClubEventType, string> = {
  tournament: 'Tournament',
  banquet: 'Banquet',
  parent_night: 'Parent Night',
  fundraiser: 'Fundraiser',
  meeting: 'Meeting',
  season_registration: 'Season Registration',
  event: 'Club Event',
  other: 'Club Event',
}

export const EVENT_COLORS = { tournament: '#F0C020', club: '#3B82F6', registration: '#10B981' } as const

type Entry = {
  id: string
  title: string
  start: string
  allDay?: boolean
  color: string
  textColor: string
  detail: {
    label: string
    when: string
    location: string | null
    lines: string[]
    tags: string[]
    registerUrl: string | null
    // A tournament's flier: a picture or a link (PDF, the event's page).
    flierUrl?: string | null
  }
}

/** '8:00 AM', '8 am', '08:00' or '08:00:00' -> '08:00'; anything else -> null. */
export function clockTime(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value.trim().toUpperCase()
  const twelve = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AP])\.?M\.?$/.exec(v)
  const twentyFour = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v)
  let h: number
  let m: number
  if (twelve) {
    h = Number(twelve[1])
    m = Number(twelve[2] ?? '0')
    if (h < 1 || h > 12 || m > 59) return null
    if (twelve[3] === 'P' && h !== 12) h += 12
    if (twelve[3] === 'A' && h === 12) h = 0
  } else if (twentyFour) {
    h = Number(twentyFour[1])
    m = Number(twentyFour[2])
    if (h > 23 || m > 59) return null
  } else {
    return null
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const longDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })

function entry(id: string, title: string, date: string, time: string | null, color: string, detail: Omit<Entry['detail'], 'when'>): Entry {
  const clock = clockTime(time)
  return {
    id,
    title,
    start: clock ? `${date}T${clock}` : date,
    ...(clock ? {} : { allDay: true }),
    color,
    // Readable text on all-day bars: dark on gold and green, white on blue.
    textColor: color === EVENT_COLORS.club ? '#FFFFFF' : '#111111',
    detail: { ...detail, when: clock ? `${longDate(date)} · ${formatTime(clock)}` : longDate(date) },
  }
}

export function clubCalendarEntries(
  tournaments: Pick<
    Tournament,
    'id' | 'name' | 'date' | 'start_time' | 'location' | 'city' | 'state' | 'status' | 'external_registration_url' | 'competition_level' | 'image_url' | 'notes'
  >[],
  clubEvents: Pick<ClubEvent, 'id' | 'title' | 'date' | 'start_time' | 'location' | 'event_type' | 'practice_group'>[],
  sessionLines: Map<string, string[]> = new Map()
): Entry[] {
  return [
    ...tournaments.map((t) =>
      entry(`t-${t.id}`, t.name, t.date, t.start_time, EVENT_COLORS.tournament, {
        label: KIND_LABELS.tournament,
        location: t.location || [t.city, t.state].filter(Boolean).join(', ') || null,
        // Weigh-in stays off: it is for families, in the parent portal.
        lines: t.notes?.trim() ? [t.notes.trim()] : [],
        tags: t.competition_level ? [t.competition_level] : [],
        registerUrl: t.status === 'open' ? t.external_registration_url || '/login' : null,
        flierUrl: t.image_url,
      })
    ),
    ...clubEvents.map((e) => {
      const registration = e.event_type === 'season_registration'
      const lines = sessionLines.get(e.id) ?? []
      return entry(
        `e-${e.id}`,
        e.title,
        e.date,
        lines.length ? null : e.start_time,
        registration ? EVENT_COLORS.registration : EVENT_COLORS.club,
        {
          label: KIND_LABELS[e.event_type] ?? 'Club Event',
          location: e.location || null,
          // Notes stay off: the Events list never showed them publicly.
          lines,
          tags: e.practice_group ? [e.practice_group] : [],
          registerUrl: registration ? '/registration' : null,
        }
      )
    }),
  ].sort((a, b) => a.start.localeCompare(b.start))
}

/** The legend for the kinds actually on the calendar. */
export function clubCalendarLegend(entries: Entry[]) {
  const has = (c: string) => entries.some((e) => e.color === c)
  return [
    ...(has(EVENT_COLORS.tournament) ? [{ label: 'Tournament', color: EVENT_COLORS.tournament }] : []),
    ...(has(EVENT_COLORS.club) ? [{ label: 'Club event', color: EVENT_COLORS.club }] : []),
    ...(has(EVENT_COLORS.registration) ? [{ label: 'Season registration', color: EVENT_COLORS.registration }] : []),
  ]
}

/** What a calendar opens on and how far it pages, from the dates on it. */
export function calendarRange(dates: string[], today: string) {
  const sorted = [...dates].sort()
  const first = sorted.find((d) => d >= today) ?? today
  const last = sorted.at(-1) && sorted.at(-1)! > today ? sorted.at(-1)! : today
  // Whole months: paging stops after the last month with something on it.
  const monthAfter = new Date(Date.UTC(+last.slice(0, 4), +last.slice(5, 7), 1)).toISOString().slice(0, 10)
  return { initialDate: first, validRange: { start: `${today.slice(0, 7)}-01`, end: monthAfter } }
}
