import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import type { ClubEventType } from '@/types/database'

export type HomeEventItem = {
  id: string
  date: string
  title: string
  kind: 'tournament' | ClubEventType
  startTime: string | null
  location: string | null
  imageUrl: string | null
}

const KIND_LABELS: Record<HomeEventItem['kind'], string> = {
  tournament: 'Tournament',
  banquet: 'Banquet',
  parent_night: 'Parent Night',
  fundraiser: 'Fundraiser',
  meeting: 'Meeting',
  season_registration: 'Season Registration',
  event: 'Club Event',
  other: 'Club Event',
}

const EVENT_PHOTOS = [
  '/images/real/clw-wizards- tornament-ariel-photo.jpg',
  '/images/real/clw-wizards-youth-tournament.jpg',
  '/images/real/clw-wizards-first-place.jpg',
]

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatWeekday(value: string) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
    : 'TBD'
}

function formatDay(value: string) {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(date) : '—'
}

function formatFullDate(value: string) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
    : 'Date to be announced'
}

function formatTime(value: string | null) {
  if (!value) return 'Time TBD'

  const normalized = value.trim().toUpperCase()
  const twelveHour = normalized.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AP]M)$/)
  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)

  let hours: number
  let minutes: number

  if (twelveHour) {
    hours = Number(twelveHour[1])
    minutes = Number(twelveHour[2] ?? '00')
    if (hours < 1 || hours > 12 || minutes > 59) return 'Time TBD'
    if (twelveHour[3] === 'PM' && hours !== 12) hours += 12
    if (twelveHour[3] === 'AM' && hours === 12) hours = 0
  } else if (twentyFourHour) {
    hours = Number(twentyFourHour[1])
    minutes = Number(twentyFourHour[2])
    if (hours > 23 || minutes > 59) return 'Time TBD'
  } else {
    return 'Time TBD'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)))
}

function eventHref(event: HomeEventItem) {
  return `/events#d${event.date}`
}

export function HomeEventsSection({ events }: { events: HomeEventItem[] }) {
  const [featured, ...upcoming] = events.slice(0, 3)

  return (
    <section className="section-light relative overflow-hidden border-y border-clw-gold/35 bg-[#F7F7F7] px-5 pb-32 pt-14 text-clw-ink sm:px-8 sm:pb-32 sm:pt-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,rgba(255,255,255,.84),transparent_48%),radial-gradient(circle_at_12%_0%,rgba(240,192,32,.1),transparent_24%)]" />
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 select-none font-display text-[11rem] leading-none text-clw-gold-dim/[0.05] sm:text-[14rem] lg:text-[18rem]">W</span>

      <div id="events" className="relative mx-auto max-w-7xl scroll-mt-24">
        <div className="flex items-end justify-between gap-6">
          <h2 className="whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.15rem,9.4vw,5rem)] font-light tracking-[-0.04em] sm:mr-3">Upcoming</span>
            <span className="inline font-display text-[clamp(2.4rem,10.2vw,5.6rem)] font-black tracking-[-0.035em]">Events</span>
          </h2>
          <Link href="/events" className="hidden shrink-0 pb-1 font-cond text-lg font-semibold uppercase tracking-[0.14em] text-[#8A620C] underline-offset-4 hover:text-[#111111] hover:underline lg:inline-block">
            Full calendar →
          </Link>
        </div>

        {!featured ? (
          <div className="mt-8 border border-dashed border-clw-ink/25 bg-white p-7 sm:p-8">
            <p className="font-display text-3xl uppercase leading-none text-clw-ink">No upcoming events posted yet.</p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-clw-muted-dark">Once dates are added to the calendar, the next tournaments, fundraisers, and club updates will appear here.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)] lg:gap-5">
            <Link
              href={eventHref(featured)}
              className="group relative isolate flex min-h-[220px] overflow-hidden border border-[#8A620C] bg-[#0B0B0B] text-white shadow-[0_18px_44px_-28px_rgba(0,0,0,.9)] transition hover:border-[#F0C020] lg:min-h-[360px]"
            >
              <span aria-hidden className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- club event photography */}
                <img
                  src={featured.imageUrl || EVENT_PHOTOS[0]}
                  alt=""
                  className="h-full w-full object-cover object-center opacity-55 transition duration-500 group-hover:scale-[1.025] group-hover:opacity-65"
                />
              </span>
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.94)_0%,rgba(0,0,0,.78)_52%,rgba(0,0,0,.38)_100%)]" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20" />

              <div className="relative flex w-full flex-col justify-between p-5 sm:p-6 lg:p-8">
                <div className="flex items-start justify-between gap-5">
                  <span className="border border-[#F0C020]/70 bg-black/85 px-3 py-1.5 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-[#F5CE50] backdrop-blur-sm">
                    Next up · {KIND_LABELS[featured.kind]}
                  </span>
                  <span className="text-right font-cond uppercase text-white">
                    <span className="block text-sm font-semibold tracking-[0.16em] text-[#F5CE50]">{formatWeekday(featured.date)}</span>
                    <span className="mt-1 block font-display text-4xl leading-none text-white">{formatDay(featured.date)}</span>
                  </span>
                </div>

                <div className="max-w-[32rem]">
                  <p className="font-cond text-sm font-semibold uppercase tracking-[0.14em] text-[#F5CE50] sm:text-base">{formatFullDate(featured.date)}</p>
                  <h3 className="mt-2 font-display text-[clamp(2.35rem,10vw,4.8rem)] uppercase leading-[0.9] tracking-[-0.02em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.8)]">
                    {featured.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-base font-medium text-white/90 sm:text-lg">
                    <span>{formatTime(featured.startTime)}</span>
                    {featured.location && (
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-[#F5CE50]" />
                        <span className="truncate">{featured.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 self-start font-cond text-base font-semibold uppercase tracking-[0.14em] text-[#F5CE50] transition group-hover:text-white">
                  Event details <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {upcoming.length > 0 && (
              <div className="grid gap-3 lg:grid-rows-2 lg:gap-4">
                {upcoming.map((event) => (
                  <Link
                    key={event.id}
                    href={eventHref(event)}
                    className="group grid min-h-[112px] grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-4 border border-[#D9C98A] bg-[#FFFDF7] px-4 py-4 text-[#111111] shadow-[0_12px_28px_-24px_rgba(0,0,0,.55)] transition hover:border-[#8A620C] sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:px-5 lg:min-h-[172px] lg:px-6"
                  >
                    <span className="flex h-full flex-col items-center justify-center border-r border-[#D9C98A] pr-4 text-center">
                      <span className="font-cond text-sm font-semibold uppercase tracking-[0.16em] text-[#8A620C]">{formatWeekday(event.date)}</span>
                      <span className="mt-1 font-display text-4xl leading-none text-[#111111] lg:text-5xl">{formatDay(event.date)}</span>
                    </span>

                    <span className="min-w-0">
                      <span className="font-cond text-xs font-semibold uppercase tracking-[0.14em] text-[#8A620C] sm:text-sm">{KIND_LABELS[event.kind]}</span>
                      <span className="mt-1.5 block truncate text-lg font-semibold leading-tight text-[#111111] sm:text-xl lg:whitespace-normal">{event.title}</span>
                      <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-[#4F4F46] sm:text-base">
                        <span>{formatTime(event.startTime)}</span>
                        {event.location && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8A620C]" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </span>
                    </span>

                    <ArrowUpRight className="h-5 w-5 shrink-0 text-[#8A620C] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ))}
                {upcoming.length === 1 && <div aria-hidden className="hidden border border-dashed border-clw-ink/15 bg-white/35 lg:block" />}
              </div>
            )}
          </div>
        )}

        <Link href="/events" className="mt-7 inline-block font-cond text-xl font-semibold uppercase tracking-[0.16em] text-[#8A620C] underline-offset-4 hover:text-[#111111] hover:underline lg:hidden">
          View full calendar →
        </Link>
      </div>
    </section>
  )
}
