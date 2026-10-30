import { MapPin } from 'lucide-react'

import { formatTime, type ScheduleDay } from '@/lib/practice'

// The practice schedule day by day, by month, the way Tony writes it (Oct 30):
// each date with who practices and when, and the days practice is off.

const monthKey = (date: string) => date.slice(0, 7)
const asDate = (date: string) => new Date(`${date}T12:00:00Z`)
const monthName = (date: string) => asDate(date).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
const weekdayShort = (date: string) => asDate(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
const weekdayLong = (date: string) => asDate(date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
const dayNumber = (date: string) => Number(date.slice(8, 10))

const timeRange = (start: string, end: string | null) => (end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start))

export function PracticeScheduleList({ days, emptyText }: { days: ScheduleDay[]; emptyText: string }) {
  if (!days.length) {
    return (
      <div className="border border-dashed border-clw-white/20 p-8">
        <p className="text-base text-clw-gray">{emptyText}</p>
      </div>
    )
  }

  // One place for every practice: say it once instead of on every line.
  const places = new Set(days.flatMap((d) => d.lines.map((l) => l.location)))
  const onePlace = places.size === 1 ? [...places][0] : null

  const months: { key: string; days: ScheduleDay[] }[] = []
  for (const day of days) {
    const last = months.at(-1)
    if (last && last.key === monthKey(day.date)) last.days.push(day)
    else months.push({ key: monthKey(day.date), days: [day] })
  }

  return (
    <div className="space-y-10">
      {onePlace && (
        <p className="flex items-center gap-2 text-base text-clw-gray">
          <MapPin className="h-4 w-4 shrink-0 text-clw-gold" /> All practices are at {onePlace}.
        </p>
      )}
      {months.map((month) => (
        <section key={month.key} aria-label={`${monthName(month.days[0].date)} ${month.key.slice(0, 4)}`}>
          <h2 className="flex items-baseline gap-3 font-display text-3xl uppercase leading-none text-clw-white">
            {monthName(month.days[0].date)}
            <span className="text-clw-gold">{month.key.slice(0, 4)}</span>
          </h2>
          <div className="mt-4 h-px w-full bg-clw-gold/35" />
          <ul className="mt-5 space-y-3">
            {month.days.map((day) => {
              const allOff = day.lines.length === 0
              return (
                <li
                  key={day.date}
                  className={`flex gap-4 border p-4 sm:gap-6 sm:p-5 ${
                    allOff ? 'border-amber-500/40 bg-clw-black-2' : 'border-clw-gold/15 bg-clw-black-2'
                  }`}
                >
                  <div className="flex w-12 shrink-0 flex-col items-center justify-center border-r border-clw-gold/20 pr-4 sm:w-14">
                    <p className="font-cond text-sm uppercase tracking-[0.18em] text-clw-gold">{weekdayShort(day.date)}</p>
                    <p className="mt-1 font-display text-3xl leading-none text-clw-white">{dayNumber(day.date)}</p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="sr-only">
                      {weekdayLong(day.date)}, {monthName(day.date)} {dayNumber(day.date)}
                    </p>
                    {day.notes.map((note) => (
                      <p key={note} className="text-base font-semibold text-clw-gold">
                        {note}
                      </p>
                    ))}
                    {day.lines.map((line) => (
                      <p key={`${line.title}-${line.start_time}`} className="text-base leading-relaxed text-clw-white">
                        <span className="font-semibold">{line.title}</span>
                        <span className="text-clw-gray"> · {timeRange(line.start_time, line.end_time)}</span>
                        {!onePlace && <span className="text-clw-gray"> · {line.location}</span>}
                      </p>
                    ))}
                    {day.off && (
                      <p className="text-base leading-relaxed text-clw-white">
                        {/* Theme-safe: readable on the portal's light mode too. */}
                        <span className="rounded-sm border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 font-semibold">
                          {allOff ? 'No practice' : `No practice for ${day.off.groups.join(', ')}`}
                        </span>
                        {day.off.reason && <span className="text-clw-gray"> · {day.off.reason}</span>}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
