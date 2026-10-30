import Link from 'next/link'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveFamilyOwnerIds } from '@/lib/family'
import { practiceCalendarEvents, practiceCalendarSetup, practiceSchedule, practiceSeasonEnd } from '@/lib/practice'
import { chicagoDateString } from '@/lib/chicago-time'
import { ClubCalendar } from '@/components/events/ClubCalendar'
import type { Practice } from '@/types/database'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  const today = chicagoDateString()
  const familyOwnerIds = await resolveFamilyOwnerIds(supabase, userId)
  const [{ data: practices, error }, { data: cancellations }, { data: athletes }] = await Promise.all([
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('practice_cancellations').select('practice_id, date, reason').gte('date', today),
    supabase.from('athletes').select('practice_group').in('parent_id', familyOwnerIds),
  ])

  const myGroups = new Set((athletes ?? []).map((a) => a.practice_group).filter((g): g is string => Boolean(g)))
  const mineView = view === 'mine' && myGroups.size > 0

  // Day by day from today, with the days practice is off (Tony, Oct 30: the
  // weekly view confused families).
  const all = (practices ?? []) as Practice[]
  const days = practiceSchedule(all, cancellations ?? [], today, practiceSeasonEnd(all, today), mineView ? myGroups : undefined)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Practice schedule</h1>
        <p className="mt-1 text-base text-clw-gray">Every practice by date, and the days there is no practice.</p>
      </div>

      {/* All / My groups filter */}
      <div className="flex gap-2">
        <FilterChip label="Full schedule" href="/schedule" active={!mineView} />
        <FilterChip
          label="My groups"
          href="/schedule?view=mine"
          active={mineView}
          disabled={myGroups.size === 0}
        />
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-base text-red-400">
          Failed to load schedule: {error.message}
        </p>
      ) : days.length ? (
        <ClubCalendar
          events={practiceCalendarEvents(days)}
          {...practiceCalendarSetup(days, today)}
          emptyText="No practices this month."
        />
      ) : (
        <p className="text-base text-clw-gray">
          {mineView ? 'No practices posted for your groups yet.' : 'No practices have been posted yet.'}
        </p>
      )}
    </div>
  )
}

function FilterChip({
  label,
  href,
  active,
  disabled,
}: {
  label: string
  href: string
  active: boolean
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-full border border-clw-gold/10 px-3 py-1 text-sm text-clw-gray/50">
        {label}
      </span>
    )
  }
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full border border-clw-gold/40 bg-clw-gold/10 px-3 py-1 text-sm text-clw-gold-ink'
          : 'rounded-full border border-clw-gold/10 px-3 py-1 text-sm text-clw-gray hover:text-clw-gold-ink'
      }
    >
      {label}
    </Link>
  )
}
