import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import { CalendarDays } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import { formatTime, practiceDays } from '@/lib/practice'
import { sessionLine, sessionsByEvent } from '@/lib/event-sessions'
import type { ClubEvent, EventSession, Practice, Tournament } from '@/types/database'
import { EventsCalendar } from '@/components/events/EventsCalendar'
import { EventsList, type CalendarItem } from '@/components/events/EventsList'

export const metadata: Metadata = pageMetadata({
  title: 'Events',
  description:
    'The Wizards Wrestling Club calendar: upcoming tournaments, banquets, fundraisers, and club events with dates, times, and locations.',
})

export default async function EventsPage() {
  const supabase = await createServerSupabase()
  const today = chicagoDateString()

  const [{ data: tournamentData }, { data: clubEventData }, { data: practiceData }, { data: cancellationData }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .neq('status', 'cancelled')
      .gte('date', today)
      .order('date', { ascending: true }),
    supabase
      .from('club_events')
      .select('*')
      .eq('active', true)
      .gte('date', today)
      .order('date', { ascending: true }),
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('practice_cancellations').select('practice_id, date').gte('date', today),
  ])
  // Split-session events list each session with its divisions.
  const { data: sessionData } = await supabase.from('event_sessions').select('*')
  const sessionsFor = sessionsByEvent((sessionData ?? []) as EventSession[])

  const tournaments = (tournamentData ?? []) as Tournament[]
  const clubEvents = (clubEventData ?? []) as ClubEvent[]

  // Practices are public so visitors see how busy the club is. Every practice
  // day through the end of the season is marked on the calendar; the list
  // spells out the next three weeks of them, one entry per day.
  const practices = (practiceData ?? []) as Practice[]
  const cancelled = new Set((cancellationData ?? []).map((c) => `${c.practice_id}|${c.date}`))
  const seasonEnd = practices.reduce((end, p) => (p.ends_on && p.ends_on > end ? p.ends_on : end), today)
  const allPracticeDays = practiceDays(practices, today, seasonEnd, cancelled)
  const listedUntil = allPracticeDays.length
    ? new Date(Date.parse(`${allPracticeDays[0].date}T00:00:00Z`) + 20 * 86_400_000).toISOString().slice(0, 10)
    : today
  const listedPracticeDays = allPracticeDays.filter((d) => d.date <= listedUntil)
  const practiceItems: CalendarItem[] = listedPracticeDays.map((day) => {
    const places = [...new Set(day.sessions.map((p) => p.location))]
    return {
      id: `p-${day.date}`,
      date: day.date,
      title: 'Practice',
      kind: 'practice' as const,
      startTime: day.sessions[0].start_time,
      location: places.length === 1 ? places[0] : null,
      registerUrl: null,
      competitionLevel: null,
      practiceGroup: null,
      details: day.sessions.map(
        (p) =>
          `${p.practice_group} · ${formatTime(p.start_time)}${p.end_time ? ` – ${formatTime(p.end_time)}` : ''}${
            places.length > 1 ? ` · ${p.location}` : ''
          }`
      ),
    }
  })

  const items: CalendarItem[] = [
    ...practiceItems,
    ...tournaments.map((t) => ({
      id: `t-${t.id}`,
      date: t.date,
      title: t.name,
      kind: 'tournament' as const,
      startTime: t.start_time,
      location: t.location || `${t.city}, ${t.state}`,
      registerUrl: t.status === 'open' ? t.external_registration_url || '/login' : null,
      competitionLevel: t.competition_level,
      practiceGroup: null,
    })),
    ...clubEvents.map((e) => ({
      id: `e-${e.id}`,
      date: e.date,
      title: e.title,
      kind: e.event_type,
      startTime: e.start_time,
      location: e.location,
      registerUrl: e.event_type === 'season_registration' ? '/registration' : null,
      competitionLevel: null,
      practiceGroup: e.practice_group,
      details: (sessionsFor.get(e.id) ?? []).map(sessionLine),
    })),
  ].sort((a, b) =>
    a.date === b.date ? (a.startTime ?? '99').localeCompare(b.startTime ?? '99') : a.date.localeCompare(b.date),
  )

  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_80%_4%,rgba(240,192,32,.13),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_35%)]" />

      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <header className="max-w-4xl">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Club Calendar</p>
          </div>
          <h1 className="mt-5 uppercase leading-[0.92]">
            <span className="mr-2 inline font-cond text-[clamp(2.9rem,10vw,5.6rem)] font-light tracking-[-0.03em] text-clw-white sm:mr-3">
              Upcoming
            </span>
            <span className="inline font-display text-[clamp(3.2rem,11vw,6.2rem)] font-black tracking-[-0.02em] text-clw-gold">
              Events
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed">
            Every practice, tournament, banquet, and club night in one place.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-32">
            <EventsCalendar
              eventDates={items.map((i) => i.date)}
              practiceDates={allPracticeDays.filter((d) => d.date > listedUntil).map((d) => d.date)}
              todayISO={today}
            />
          </div>
          <EventsList items={items} />
        </div>
      </section>
    </main>
  )
}
