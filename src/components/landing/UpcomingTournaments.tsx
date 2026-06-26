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
    <div className="chamfer-md card-depth flex h-full min-h-[390px] flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Upcoming events</h2>
          <p className="mt-1 text-sm text-clw-gray">The next stops on the schedule.</p>
        </div>
        <a href="/login" className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-clw-gold hover:text-clw-gold-l sm:block">
          View all
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col justify-center rounded-md border border-dashed border-clw-gold/15 bg-clw-black/30 p-5">
          <p className="font-medium text-clw-white">No public events posted yet.</p>
          <p className="mt-2 text-sm text-clw-gray">Once the schedule is live, tournaments, open mats, and parent meetings will appear here.</p>
        </div>
      ) : (
        <div className="mt-5 flex-1 space-y-2">
          {rows.map((t) => {
            const { month, day } = dayParts(t.date)
            return (
              <div
                key={t.id}
                className="group flex items-center gap-3 rounded-md border border-clw-gold/10 bg-clw-black/40 px-3.5 py-3.5 transition-colors hover:border-clw-gold/40 hover:bg-clw-black/70"
              >
                <div className="flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-md bg-clw-gold/10 px-3 py-2">
                  <span className="font-cond text-[0.65rem] uppercase tracking-wide text-clw-gold-ink">{month}</span>
                  <span className="font-display text-xl leading-none text-clw-white">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-clw-white">{t.name}</p>
                  <p className="truncate text-xs text-clw-gray">
                    {t.location}, {t.city}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-auto border-t border-clw-gold/10 pt-5 text-xs text-clw-gray">
        Members register and manage event details from the parent portal.
      </p>
    </div>
  )
}
