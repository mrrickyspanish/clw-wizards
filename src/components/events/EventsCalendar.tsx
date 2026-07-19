'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * Month-grid calendar for the public events page. Days that have events are
 * gold anchor links jumping to that date's entry in the list below the
 * calendar (`#d{date}`), so the calendar stays a lightweight client leaf with
 * no shared state. `todayISO` comes from the server (Chicago time) so the
 * highlighted "today" never depends on the visitor's clock or hydration.
 */
export function EventsCalendar({ eventDates, todayISO }: { eventDates: string[]; todayISO: string }) {
  const [todayYear, todayMonth] = todayISO.split('-').map(Number)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const date of eventDates) map.set(date, (map.get(date) ?? 0) + 1)
    return map
  }, [eventDates])

  // Months are navigable from the current month through the later of the last
  // event month or five months out, so the range always has somewhere to go.
  const minKey = `${todayYear}-${pad(todayMonth)}`
  const maxKey = useMemo(() => {
    const fiveOut = new Date(todayYear, todayMonth - 1 + 5, 1)
    let max = `${fiveOut.getFullYear()}-${pad(fiveOut.getMonth() + 1)}`
    for (const date of eventDates) {
      const key = date.slice(0, 7)
      if (key > max) max = key
    }
    return max
  }, [eventDates, todayYear, todayMonth])

  const [view, setView] = useState({ year: todayYear, month: todayMonth - 1 })
  const viewKey = `${view.year}-${pad(view.month + 1)}`
  const canPrev = viewKey > minKey
  const canNext = viewKey < maxKey

  function shiftMonth(delta: number) {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="chamfer-md card-depth border border-clw-gold/20 bg-clw-black-2 p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-11 w-11 items-center justify-center border border-clw-gold/30 text-clw-gold transition hover:border-clw-gold hover:bg-clw-gold/10 disabled:cursor-not-allowed disabled:border-clw-white/10 disabled:text-clw-white/25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-center font-display text-3xl uppercase leading-none tracking-wide text-clw-white sm:text-4xl">
          {MONTHS[view.month]} <span className="text-clw-gold">{view.year}</span>
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-11 w-11 items-center justify-center border border-clw-gold/30 text-clw-gold transition hover:border-clw-gold hover:bg-clw-gold/10 disabled:cursor-not-allowed disabled:border-clw-white/10 disabled:text-clw-white/25"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {WEEKDAYS.map((day) => (
          <p key={day} className="pb-1 font-cond text-sm uppercase tracking-[0.14em] text-clw-gray">
            {day}
          </p>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden />
          const dateStr = `${view.year}-${pad(view.month + 1)}-${pad(day)}`
          const eventCount = counts.get(dateStr) ?? 0
          const isToday = dateStr === todayISO

          if (eventCount > 0) {
            return (
              <a
                key={dateStr}
                href={`#d${dateStr}`}
                aria-label={`${eventCount} event${eventCount === 1 ? '' : 's'} on ${MONTHS[view.month]} ${day}`}
                className={`flex h-12 flex-col items-center justify-center border bg-clw-gold/10 text-base font-semibold text-clw-gold transition hover:bg-clw-gold/25 ${
                  isToday ? 'border-clw-gold' : 'border-clw-gold/40'
                }`}
              >
                {day}
                <span aria-hidden className="mt-1 flex gap-0.5">
                  {Array.from({ length: Math.min(eventCount, 3) }, (_, i) => (
                    <span key={i} className="h-1 w-1 bg-clw-gold" />
                  ))}
                </span>
              </a>
            )
          }

          return (
            <span
              key={dateStr}
              className={`flex h-12 flex-col items-center justify-center text-base ${
                isToday
                  ? 'border border-clw-white/40 font-semibold text-clw-white'
                  : dateStr < todayISO
                    ? 'text-clw-white/25'
                    : 'text-clw-gray'
              }`}
            >
              {day}
              {isToday ? <span aria-hidden className="mt-1 h-1 w-1" /> : null}
            </span>
          )
        })}
      </div>

      <p className="mt-5 border-t border-clw-white/10 pt-4 text-sm leading-relaxed text-clw-gray">
        {eventDates.length > 0
          ? 'Gold days have events. Tap one to jump to the details below.'
          : 'Event days will show in gold as dates are added.'}
      </p>
    </div>
  )
}
