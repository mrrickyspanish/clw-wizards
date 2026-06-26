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
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Upcoming events</h2>
      <p className="mt-1 text-sm text-clw-gray">The next stops on the schedule.</p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-clw-gray">Nothing on the calendar yet. Check back soon.</p>
      ) : (
        <div className="mt-5 flex-1 space-y-2">
          {rows.map((t) => {
            const { month, day } = dayParts(t.date)
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-md border border-clw-gold/10 bg-clw-black/40 px-3 py-3"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-clw-gold/10">
                  <span className="font-cond text-[0.65rem] uppercase tracking-wide text-clw-gold-ink">{month}</span>
                  <span className="font-display text-lg leading-none text-clw-white">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-clw-white">{t.name}</p>
                  <p className="truncate text-xs text-clw-gray">
                    {t.location}, {t.city}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
