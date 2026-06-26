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
    <div className="chamfer-md card-depth flex h-full min-h-[390px] flex-col border border-clw-gold/20 bg-clw-black-2 p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl uppercase tracking-wide text-clw-white">Upcoming events</h2>
          <p className="mt-1 text-base leading-relaxed text-clw-gray">The next stops on the schedule.</p>
        </div>
        <Link href="/login" className="hidden text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold hover:text-clw-gold-l sm:block">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col justify-center rounded-md border border-dashed border-clw-gold/25 bg-clw-black/45 p-6">
          <p className="text-base font-semibold text-clw-white">No public events posted yet.</p>
          <p className="mt-2 text-base leading-relaxed text-clw-gray">Once the schedule is live, tournaments, open mats, and parent meetings will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 flex-1 space-y-2.5">
          {rows.map((t) => {
            const { month, day } = dayParts(t.date)
            return (
              <div
                key={t.id}
                className="group flex items-center gap-4 rounded-md border border-clw-gold/20 bg-clw-black/55 px-4 py-4 transition-colors hover:border-clw-gold/50 hover:bg-clw-black/80"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-clw-gold/15 px-3 py-2">
                  <span className="font-cond text-xs uppercase tracking-wide text-clw-gold-ink">{month}</span>
                  <span className="font-display text-2xl leading-none text-clw-white">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold leading-tight text-clw-white">{t.name}</p>
                  <p className="mt-0.5 truncate text-sm text-clw-gray">
                    {t.location}, {t.city}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-auto border-t border-clw-gold/15 pt-5 text-sm leading-relaxed text-clw-gray">
        Members register and manage event details from the parent portal.
      </p>
    </div>
  )
}
