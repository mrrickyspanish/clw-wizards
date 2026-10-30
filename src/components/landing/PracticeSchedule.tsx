import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { createPublicSupabase } from '@/lib/supabase/public'
import { chicagoDatePlusDays, chicagoDateString } from '@/lib/chicago-time'
import { practiceCalendarEvents, practiceCalendarSetup, practiceSchedule } from '@/lib/practice'
import { PracticeCalendar } from '@/components/events/PracticeCalendar'
import type { Practice } from '@/types/database'

/**
 * The next two weeks of practice on the Groups page, by date, with the days
 * off, and a link to the whole season (Tony, Oct 30: the weekly grid by group
 * confused families). Same rows admins edit in Practices & Events.
 */
export async function PracticeSchedule() {
  const supabase = createPublicSupabase()
  if (!supabase) return null
  const today = chicagoDateString()
  const [{ data: practiceData, error }, { data: cancellationData }] = await Promise.all([
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('practice_cancellations').select('practice_id, date, reason').gte('date', today),
  ])
  if (error) return null
  const days = practiceSchedule((practiceData ?? []) as Practice[], cancellationData ?? [], today, chicagoDatePlusDays(13))
  if (!days.length) return null

  return (
    <section id="schedule" className="mt-6 scroll-mt-44 chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-4 sm:p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-clw-gold" />
        <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Practice Schedule</p>
      </div>
      <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">The next two weeks</h2>
      <div className="mt-7">
        <PracticeCalendar events={practiceCalendarEvents(days)} {...practiceCalendarSetup(days, today)} twoWeeks />
      </div>
      <Link
        href="/practices"
        className="mt-6 inline-flex min-h-11 items-center text-lg font-semibold text-clw-gold hover:text-clw-white"
      >
        See the whole season&apos;s practice schedule
      </Link>
      <p className="mt-4 text-base text-clw-gray">
        Not sure which group your wrestler is in? Coaches place each wrestler at the start of the season.
      </p>
    </section>
  )
}
