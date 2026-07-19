import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import type { ClubEvent, Tournament } from '@/types/database'
import { EventsCalendar } from '@/components/events/EventsCalendar'
import { EventsList, type CalendarItem } from '@/components/events/EventsList'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'The Wizards Wrestling Club calendar: upcoming tournaments, banquets, fundraisers, and club events with dates, times, and locations.',
}

export default async function EventsPage() {
  const supabase = await createServerSupabase()
  const today = chicagoDateString()

  const [{ data: tournamentData }, { data: clubEventData }] = await Promise.all([
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
  ])

  const tournaments = (tournamentData ?? []) as Tournament[]
  const clubEvents = (clubEventData ?? []) as ClubEvent[]

  const items: CalendarItem[] = [
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
      registerUrl: null,
      competitionLevel: null,
      practiceGroup: e.practice_group,
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
            Every tournament, banquet, and club night in one place.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-32">
            <EventsCalendar eventDates={items.map((i) => i.date)} todayISO={today} />
          </div>
          <EventsList items={items} />
        </div>
      </section>
    </main>
  )
}
