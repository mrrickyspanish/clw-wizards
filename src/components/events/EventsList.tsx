import { ArrowUpRight, MapPin } from 'lucide-react'

import type { ClubEventType } from '@/types/database'

export type CalendarItem = {
  id: string
  date: string
  title: string
  kind: 'tournament' | ClubEventType
  startTime: string | null
  location: string | null
  registerUrl: string | null
  competitionLevel: string | null
  practiceGroup: string | null
}

const KIND_LABELS: Record<CalendarItem['kind'], string> = {
  tournament: 'Tournament',
  banquet: 'Banquet',
  parent_night: 'Parent Night',
  fundraiser: 'Fundraiser',
  meeting: 'Meeting',
  event: 'Club Event',
  other: 'Club Event',
}

const MONTH_HEADINGS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDay(date: string) {
  return String(Number(date.split('-')[2]))
}

function formatWeekday(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
}

function formatTime(value: string | null) {
  if (!value) return null
  const [hours = '0', minutes = '0'] = value.split(':')
  const d = new Date()
  d.setHours(Number(hours), Number(minutes), 0, 0)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Chronological event list grouped by month. The first item of each date gets
 * the `#d{date}` anchor the calendar's gold days link to.
 */
export function EventsList({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-clw-white/20 p-8 sm:p-10">
        <p className="font-display text-3xl uppercase leading-none text-clw-white sm:text-4xl">
          Nothing on the calendar yet.
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-clw-gray">
          Tournament dates and club events are posted here as soon as they are scheduled. Check back soon, or follow
          the club on Facebook for announcements.
        </p>
      </div>
    )
  }

  const monthGroups: { key: string; items: CalendarItem[] }[] = []
  const seenDates = new Set<string>()
  const anchorIds = new Map<string, string>()
  for (const item of items) {
    const key = item.date.slice(0, 7)
    const group = monthGroups[monthGroups.length - 1]
    if (!group || group.key !== key) monthGroups.push({ key, items: [item] })
    else group.items.push(item)
    if (!seenDates.has(item.date)) {
      seenDates.add(item.date)
      anchorIds.set(item.id, `d${item.date}`)
    }
  }

  return (
    <div className="space-y-10">
      {monthGroups.map((group) => {
        const [year, month] = group.key.split('-').map(Number)
        return (
          <section key={group.key}>
            <h2 className="flex items-baseline gap-3 font-display text-3xl uppercase leading-none text-clw-white sm:text-4xl">
              {MONTH_HEADINGS[month - 1]}
              <span className="text-clw-gold">{year}</span>
            </h2>
            <div className="mt-4 h-px w-full bg-clw-gold/35" />
            <ul className="mt-5 space-y-4">
              {group.items.map((item) => {
                const time = formatTime(item.startTime)
                const external = Boolean(item.registerUrl && item.registerUrl.startsWith('http'))
                return (
                  <li
                    key={item.id}
                    id={anchorIds.get(item.id)}
                    className="flex scroll-mt-32 gap-5 border border-clw-gold/15 bg-clw-black-2 p-5 transition hover:border-clw-gold/45 sm:gap-6 sm:p-6"
                  >
                    <div className="flex w-14 shrink-0 flex-col items-center justify-center border-r border-clw-gold/20 pr-4 sm:w-16 sm:pr-5">
                      <p className="font-cond text-sm uppercase tracking-[0.18em] text-clw-gold">
                        {formatWeekday(item.date)}
                      </p>
                      <p className="mt-1 font-display text-4xl leading-none text-clw-white sm:text-5xl">
                        {formatDay(item.date)}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`border px-2.5 py-1 font-cond text-sm uppercase tracking-[0.14em] ${
                            item.kind === 'tournament'
                              ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                              : 'border-clw-white/20 bg-clw-white/5 text-clw-white/80'
                          }`}
                        >
                          {KIND_LABELS[item.kind]}
                        </span>
                        {item.competitionLevel && (
                          <span className="border border-clw-white/20 bg-clw-white/5 px-2.5 py-1 font-cond text-sm uppercase tracking-[0.14em] text-clw-white/80">
                            {item.competitionLevel}
                          </span>
                        )}
                        {item.practiceGroup && (
                          <span className="border border-clw-white/20 bg-clw-white/5 px-2.5 py-1 font-cond text-sm uppercase tracking-[0.14em] text-clw-white/80">
                            {item.practiceGroup}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-xl font-semibold leading-snug text-clw-white sm:text-2xl">
                        {item.title}
                      </h3>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base leading-relaxed text-clw-gray">
                        {time && <span>{time}</span>}
                        {item.location && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 text-clw-gold" />
                            <span className="truncate">{item.location}</span>
                          </span>
                        )}
                      </div>

                      {item.registerUrl && (
                        <a
                          href={item.registerUrl}
                          target={external ? '_blank' : undefined}
                          rel={external ? 'noopener noreferrer' : undefined}
                          className="-mx-1 -my-2 mt-2 inline-flex items-center gap-1.5 px-1 py-2 font-cond text-base uppercase tracking-[0.16em] text-clw-gold underline-offset-4 transition hover:text-clw-gold-l hover:underline"
                        >
                          Register
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
