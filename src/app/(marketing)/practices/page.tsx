import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { pageMetadata } from '@/lib/page-metadata'
import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import { practiceCalendarEvents, practiceCalendarSetup, practiceSchedule, practiceSeasonEnd } from '@/lib/practice'
import { PracticeCalendar } from '@/components/events/PracticeCalendar'
import type { Practice } from '@/types/database'

export const metadata: Metadata = pageMetadata({
  title: 'Practice Schedule',
  description: 'Wizards Wrestling Club practices by date: which groups practice when, and the days there is no practice.',
})

// Every practice by date, and the days off (Tony, Oct 30).
export default async function PracticesPage() {
  const supabase = await createServerSupabase()
  const today = chicagoDateString()
  const [{ data: practiceData }, { data: cancellationData }] = await Promise.all([
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('practice_cancellations').select('practice_id, date, reason').gte('date', today),
  ])
  const practices = (practiceData ?? []) as Practice[]
  const days = practiceSchedule(practices, cancellationData ?? [], today, practiceSeasonEnd(practices, today))

  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <header className="max-w-4xl">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Practice Schedule</p>
          </div>
          <h1 className="mt-5 uppercase leading-[0.92]">
            <span className="mr-2 inline font-cond text-[clamp(2.9rem,10vw,5.6rem)] font-light tracking-[-0.03em] text-clw-white sm:mr-3">
              Practice
            </span>
            <span className="inline font-display text-[clamp(3.2rem,11vw,6.2rem)] font-black tracking-[-0.02em] text-clw-gold">
              Days
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed">
            Which groups practice each day, and the days there is no practice.
          </p>
          <Link href="/events" className="mt-6 inline-flex min-h-11 items-center text-base text-clw-gold hover:text-clw-white">
            Tournaments and club events are on the Events page
          </Link>
        </header>

        <div className="mt-10">
          {days.length ? (
            <PracticeCalendar events={practiceCalendarEvents(days)} {...practiceCalendarSetup(days, today)} />
          ) : (
            <p className="text-base text-clw-gray">The practice schedule hasn&apos;t been posted yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}
