import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import type { Tournament } from '@/types/database'

function dayParts(value: string) {
  const d = new Date(`${value}T00:00:00`)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
  }
}

export function UpcomingTournaments({ tournaments }: { tournaments: Tournament[] }) {
  const rows = tournaments.slice(0, 3)

  return (
    <div className="chamfer-md card-depth flex h-full min-h-[410px] flex-col border border-clw-gold/20 bg-clw-black-2 p-7 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Schedule</p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-none tracking-wide text-clw-white">Upcoming events</h2>
          <p className="mt-4 text-lg leading-relaxed text-clw-gray">The next stops on the schedule.</p>
        </div>
        <Link href="/login" className="hidden font-display text-lg uppercase tracking-wide text-clw-gold hover:text-clw-gold-l sm:block">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-7 flex flex-1 flex-col justify-center border border-dashed border-clw-gold/25 bg-clw-black/45 p-6">
          <p className="text-lg font-semibold text-clw-white">No public events posted yet.</p>
          <p className="mt-3 text-lg leading-relaxed text-clw-gray">Once the schedule is live, events and parent meetings will appear here.</p>
        </div>
      ) : (
        <div className="mt-7 flex-1 space-y-3">
          {rows.map((t) => {
            const { month, day } = dayParts(t.date)
            return (
              <div key={t.id} className="group flex items-center gap-4 border border-clw-gold/20 bg-clw-black/55 px-4 py-5 transition-colors hover:border-clw-gold/50 hover:bg-clw-black/80">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center bg-clw-gold/15 px-3 py-2">
                  <span className="font-cond text-sm uppercase tracking-wide text-clw-gold-ink">{month}</span>
                  <span className="font-display text-3xl leading-none text-clw-white">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold leading-tight text-clw-white">{t.name}</p>
                  <p className="mt-1 truncate text-base text-clw-gray">
                    {t.location}, {t.city}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-auto border-t border-clw-gold/15 pt-6 text-base leading-relaxed text-clw-gray">
        Members register and manage event details from the parent portal.
      </p>
    </div>
  )
}
