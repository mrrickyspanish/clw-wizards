import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { pageMetadata } from '@/lib/page-metadata'
import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import { sessionLine, sessionsByEvent } from '@/lib/event-sessions'
import { calendarRange, clubCalendarEntries, clubCalendarLegend } from '@/lib/club-calendar'
import type { ClubEvent, EventSession, Tournament } from '@/types/database'
import { ClubCalendar } from '@/components/events/ClubCalendar'

export const metadata: Metadata = pageMetadata({
  title: 'Events',
  description:
    'The Wizards Wrestling Club calendar: upcoming tournaments, banquets, fundraisers, and club events with dates, times, and locations.',
})

// Tournaments and club events on a standard calendar (Ricky, Oct 30). Practice
// times are for signed-in families only: they are in the parent portal.
export default async function EventsPage() {
  const supabase = await createServerSupabase()
  const today = chicagoDateString()

  const [{ data: tournamentData }, { data: clubEventData }, { data: sessionData }] = await Promise.all([
    supabase.from('tournaments').select('*').neq('status', 'cancelled').gte('date', today).order('date', { ascending: true }),
    supabase.from('club_events').select('*').eq('active', true).gte('date', today).order('date', { ascending: true }),
    supabase.from('event_sessions').select('*'),
  ])
  const sessions = new Map(
    [...sessionsByEvent((sessionData ?? []) as EventSession[])].map(([id, rows]) => [id, rows.map(sessionLine)])
  )
  const entries = clubCalendarEntries((tournamentData ?? []) as Tournament[], (clubEventData ?? []) as ClubEvent[], sessions)
  const range = calendarRange(
    entries.map((e) => e.start.slice(0, 10)),
    today
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
            Tournaments, banquets, fundraisers, and club nights. Tap an event for the details.
          </p>
          <p className="mt-4 text-base text-clw-gray">
            Club families: practice times are in the{' '}
            <Link href="/schedule" className="text-clw-gold underline-offset-4 hover:underline">
              parent portal
            </Link>
            .
          </p>
        </header>

        <div className="mt-10">
          <ClubCalendar
            events={entries}
            {...range}
            legend={clubCalendarLegend(entries)}
            emptyText="No events this month."
          />
        </div>
      </section>
    </main>
  )
}
