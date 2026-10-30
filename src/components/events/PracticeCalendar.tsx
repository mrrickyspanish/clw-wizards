'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'

import type { PracticeCalendarEvent } from '@/lib/practice'

// The practice schedule as a standard calendar (FullCalendar, MIT): a month
// grid on a computer, the phone-style list (agenda) on a phone, with the usual
// Month / List switch. Colors come from the site's theme (.clw-calendar in
// globals.css), so it reads in dark and light mode.

// Below this width (of the calendar itself, not the screen: the portal has a
// side menu) a month grid's cells are too narrow, so it shows the list.
const NARROW_PX = 640

export function PracticeCalendar({
  events,
  initialDate,
  validRange,
  legend,
  twoWeeks = false,
}: {
  events: PracticeCalendarEvent[]
  initialDate: string
  // First and last day anyone can page to (end is exclusive, as FullCalendar expects).
  validRange: { start: string; end: string }
  legend: { label: string; color: string }[]
  // Groups page: just the next two weeks as a list, no paging.
  twoWeeks?: boolean
}) {
  const ref = useRef<FullCalendar>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // Which view fits is known only in the browser, so the calendar renders after mount.
  const [phone, setPhone] = useState<boolean | null>(null)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const fit = () => {
      const narrow = box.clientWidth < NARROW_PX
      setPhone((was) => {
        // Narrow gets the list (agenda); the month grid is for wider space.
        if (was !== null && was !== narrow && !twoWeeks) {
          ref.current?.getApi().changeView(narrow ? 'listMonth' : 'dayGridMonth')
        }
        return narrow
      })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [twoWeeks])

  return (
    <div ref={boxRef} className="clw-calendar space-y-4">
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Colors">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-base text-clw-white">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
      {phone === null ? (
        <div className="min-h-[32rem]" aria-busy="true" />
      ) : (
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, listPlugin]}
          initialView={twoWeeks ? 'listTwoWeeks' : phone ? 'listMonth' : 'dayGridMonth'}
          views={{
            listTwoWeeks: { type: 'list', duration: { weeks: 2 } },
            // Month cells show the start time only, as Google and Apple calendars do.
            dayGridMonth: { displayEventEnd: false },
          }}
          initialDate={initialDate}
          validRange={validRange}
          headerToolbar={
            twoWeeks
              ? false
              : phone
                ? { left: 'title', center: '', right: 'prev,next' }
                : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }
          }
          buttonText={{ today: 'Today', dayGridMonth: 'Month', listMonth: 'List' }}
          events={events}
          height="auto"
          firstDay={0}
          dayMaxEvents={4}
          allDayText="All day"
          eventDisplay="auto"
          displayEventEnd
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          listDayFormat={{ weekday: 'long', month: 'long', day: 'numeric' }}
          listDaySideFormat={false}
          noEventsContent="No practices this month."
          eventInteractive={false}
          // Full text on hover where a month cell cuts a long name short.
          eventDidMount={(info) => info.el.setAttribute('title', info.event.title)}
          fixedWeekCount={false}
        />
      )}
    </div>
  )
}
