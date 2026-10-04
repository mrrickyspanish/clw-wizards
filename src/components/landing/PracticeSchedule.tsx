import { CalendarDays, Clock, MapPin } from 'lucide-react'

import { createPublicSupabase } from '@/lib/supabase/public'
import { chicagoDateString } from '@/lib/chicago-time'
import { WEEKDAYS, formatPracticeDate, formatTime, practiceEnded } from '@/lib/practice'
import { ORG } from '@/config/org.config'
import type { Practice } from '@/types/database'

// Monday-first weekly order (0 = Sunday in the data).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** Active practices whose series has not ended, read with the public client. */
async function loadPractices(): Promise<Practice[]> {
  const supabase = createPublicSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from('practices').select('*').eq('active', true)
  if (error) return []
  const today = chicagoDateString()
  return ((data ?? []) as Practice[]).filter((practice) => !practiceEnded(practice, today))
}

function timeRange(practice: Practice): string {
  return practice.end_time
    ? `${formatTime(practice.start_time)} – ${formatTime(practice.end_time)}`
    : formatTime(practice.start_time)
}

/**
 * The weekly practice schedule for the public site, one column per group, so a
 * family can see when practice is without signing in. It reads the same rows
 * admins edit in Practices & Events, which the parent portal also shows.
 */
export async function PracticeSchedule() {
  const practices = await loadPractices()
  if (practices.length === 0) return null

  const groupOrder = [
    ...ORG.practiceGroups.filter((group) => practices.some((p) => p.practice_group === group)),
    ...[...new Set(practices.map((p) => p.practice_group))].filter((group) => !ORG.practiceGroups.includes(group)).sort(),
  ]
  const byGroup = groupOrder.map((group) => ({
    group,
    sessions: practices
      .filter((p) => p.practice_group === group)
      .sort((a, b) => DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday) || a.start_time.localeCompare(b.start_time)),
  }))

  const locations = [...new Set(practices.map((p) => p.location.trim()))]
  const sharedLocation = locations.length === 1 ? locations[0] : null

  const starts = practices.map((p) => p.starts_on).filter((d): d is string => Boolean(d)).sort()
  const ends = practices.map((p) => p.ends_on).filter((d): d is string => Boolean(d)).sort()
  const seasonLine =
    starts.length === practices.length && ends.length === practices.length
      ? `${formatPracticeDate(starts[0])} – ${formatPracticeDate(ends[ends.length - 1])}`
      : null

  return (
    <section id="schedule" className="mt-6 scroll-mt-44 chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-clw-gold" />
        <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Practice Schedule</p>
      </div>
      <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">When each group trains</h2>
      <div className="mt-5 flex flex-col gap-2 text-lg text-clw-gray sm:flex-row sm:flex-wrap sm:gap-x-8">
        {seasonLine && (
          <p className="flex items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-clw-gold" /> Season: {seasonLine}
          </p>
        )}
        {sharedLocation && (
          <p className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-clw-gold" /> All practices at {sharedLocation}
          </p>
        )}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {byGroup.map(({ group, sessions }) => (
          <div key={group} className="border border-clw-gold/15 bg-clw-black p-5">
            <h3 className="font-display text-2xl uppercase text-clw-gold">{group}</h3>
            <ul className="mt-3 space-y-3">
              {sessions.map((practice) => (
                <li key={practice.id}>
                  <p className="text-base font-semibold text-clw-white">{WEEKDAYS[practice.weekday]}</p>
                  <p className="text-base text-clw-gray">{timeRange(practice)}</p>
                  {!sharedLocation && <p className="text-base text-clw-gray">{practice.location}</p>}
                  {practice.notes && <p className="text-base text-clw-gray">{practice.notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-base text-clw-gray">
        Not sure which group your wrestler is in? Coaches place each wrestler at the start of the season.
      </p>
    </section>
  )
}
