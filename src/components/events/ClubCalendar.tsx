'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import { ArrowUpRight, Clock, MapPin } from 'lucide-react'

import { TournamentFlier } from '@/components/events/TournamentFlier'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// The club's calendars (FullCalendar, MIT): a month grid with room for it, the
// phone-style list (agenda) when narrow, with the usual Month / List switch.
// Colors come from the site's theme (.clw-calendar in globals.css), so it
// reads in dark mode and the portal's light mode.

// Below this width (of the calendar itself, not the screen: the portal has a
// side menu) month cells are too narrow, so it shows the list.
const NARROW_PX = 640

export type CalendarEntry = {
  id: string
  title: string
  // 'YYYY-MM-DD' for all day, 'YYYY-MM-DDTHH:MM' for a time.
  start: string
  end?: string
  allDay?: boolean
  color: string
  textColor?: string
  // Shown in the details box when the calendar is clickable.
  detail?: {
    label: string
    when: string
    location: string | null
    lines: string[]
    tags: string[]
    registerUrl: string | null
    flierUrl?: string | null
  }
}

export function ClubCalendar({
  events,
  initialDate,
  validRange,
  legend,
  emptyText,
}: {
  events: CalendarEntry[]
  initialDate: string
  // First and last day anyone can page to (end is exclusive, as FullCalendar expects).
  validRange: { start: string; end: string }
  legend: { label: string; color: string }[]
  emptyText: string
}) {
  const ref = useRef<FullCalendar>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // Which view fits is known only in the browser, so the calendar renders after mount.
  const [narrow, setNarrow] = useState<boolean | null>(null)
  const [open, setOpen] = useState<CalendarEntry | null>(null)
  const clickable = events.some((e) => e.detail)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const fit = () => {
      const now = box.clientWidth < NARROW_PX
      setNarrow((was) => {
        if (was !== null && was !== now) ref.current?.getApi().changeView(now ? 'listMonth' : 'dayGridMonth')
        return now
      })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const detail = open?.detail
  const external = Boolean(detail?.registerUrl && /^https?:\/\//.test(detail.registerUrl))

  return (
    <div ref={boxRef} className="clw-calendar space-y-4">
      {legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Colors">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-base text-clw-white">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      {narrow === null ? (
        <div className="min-h-[32rem]" aria-busy="true" />
      ) : (
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, listPlugin]}
          initialView={narrow ? 'listMonth' : 'dayGridMonth'}
          // Month cells show the start time only, as Google and Apple calendars do.
          views={{ dayGridMonth: { displayEventEnd: false } }}
          initialDate={initialDate}
          validRange={validRange}
          headerToolbar={
            narrow
              ? { left: 'title', center: '', right: 'prev,next' }
              : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }
          }
          buttonText={{ today: 'Today', dayGridMonth: 'Month', listMonth: 'List' }}
          events={events.map(({ detail: d, ...e }) => ({ ...e, extendedProps: { detail: d } }))}
          height="auto"
          firstDay={0}
          dayMaxEvents={4}
          allDayText="All day"
          displayEventEnd
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          listDayFormat={{ weekday: 'long', month: 'long', day: 'numeric' }}
          listDaySideFormat={false}
          noEventsContent={emptyText}
          fixedWeekCount={false}
          eventInteractive={clickable}
          eventClick={(info) => {
            const entry = events.find((e) => e.id === info.event.id)
            if (entry?.detail) setOpen(entry)
          }}
          // Full text on hover where a month cell cuts a long name short.
          eventDidMount={(info) => info.el.setAttribute('title', info.event.title)}
        />
      )}

      <Dialog open={Boolean(detail)} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {open && detail && (
            <>
              <DialogHeader>
                <p className="font-cond text-sm uppercase tracking-[0.16em] text-clw-gold">{detail.label}</p>
                <DialogTitle className="text-2xl leading-snug text-clw-white">{open.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-base text-clw-gray">
                  <Clock className="h-4 w-4 shrink-0 text-clw-gold" /> {detail.when}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-base text-clw-gray">
                {detail.location && (
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-clw-gold" /> {detail.location}
                  </p>
                )}
                {detail.tags.length > 0 && <p className="text-clw-white">{detail.tags.join(' · ')}</p>}
                {detail.lines.length > 0 && (
                  <ul className="space-y-1">
                    {detail.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
                {detail.flierUrl && <TournamentFlier url={detail.flierUrl} name={open.title} />}
                {detail.registerUrl && (
                  <a
                    href={detail.registerUrl}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="inline-flex min-h-11 items-center gap-1.5 bg-clw-gold px-5 font-cond text-base font-semibold uppercase tracking-[0.12em] text-clw-black hover:bg-clw-gold-l"
                  >
                    Register <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
