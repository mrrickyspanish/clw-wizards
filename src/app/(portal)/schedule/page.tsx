import Link from 'next/link'
import { MapPin } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { WEEKDAYS, formatTime } from '@/lib/practice'
import type { Practice } from '@/types/database'

// Monday-first weekly order (0 = Sunday in the data).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  const [{ data: practices, error }, { data: athletes }] = await Promise.all([
    supabase.from('practices').select('*').eq('active', true),
    supabase.from('athletes').select('practice_group').eq('parent_id', userId),
  ])

  const myGroups = new Set((athletes ?? []).map((a) => a.practice_group))
  const mineView = view === 'mine' && myGroups.size > 0

  const all = (practices ?? []) as Practice[]
  const shown = mineView ? all.filter((p) => myGroups.has(p.practice_group)) : all

  const byDay = new Map<number, Practice[]>()
  for (const p of shown) {
    const list = byDay.get(p.weekday) ?? []
    list.push(p)
    byDay.set(p.weekday, list)
  }
  for (const list of byDay.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time))

  const daysWithPractice = DAY_ORDER.filter((d) => byDay.has(d))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Weekly schedule</h1>
        <p className="mt-1 text-sm text-clw-gray">Practice times by day. Your groups are highlighted.</p>
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

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load schedule: {error.message}
        </p>
      )}

      {!error && daysWithPractice.length === 0 && (
        <div className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-10 text-center">
          <p className="text-clw-gray">
            {mineView ? 'No practices posted for your groups yet.' : 'No practices have been posted yet.'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {daysWithPractice.map((day) => (
          <section key={day} className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
            <h2 className="mb-3 font-display text-xl text-clw-white">{WEEKDAYS[day]}</h2>
            <ul className="space-y-2">
              {byDay.get(day)!.map((p) => {
                const mine = myGroups.has(p.practice_group)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-clw-black px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-clw-white">{formatTime(p.start_time)}</span>
                        <span
                          className={
                            mine
                              ? 'rounded-full border border-clw-gold/40 bg-clw-gold/10 px-2 py-0.5 text-xs text-clw-gold-ink'
                              : 'rounded-full border border-clw-gray/30 px-2 py-0.5 text-xs text-clw-gray'
                          }
                        >
                          {p.practice_group}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-clw-gray">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.location}
                      </p>
                    </div>
                    {p.end_time && (
                      <span className="shrink-0 text-sm text-clw-gray">
                        until {formatTime(p.end_time)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
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
