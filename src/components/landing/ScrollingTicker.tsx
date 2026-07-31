'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { chicagoDatePlusDays, chicagoDateString } from '@/lib/chicago-time'
import { createOptionalBrowserSupabase } from '@/lib/supabase/browser'
import styles from './ScrollingTicker.module.css'

export type TickerItem = {
  text: string
  kind?: 'info' | 'promo' | 'event'
  href?: string
}

export type ScrollingTickerProps = {
  items?: TickerItem[]
  ariaLabel?: string
  intervalMs?: number
  className?: string
}

type CalendarCandidate = {
  title: string
  date: string
  startTime: string | null
}

type PlatinumSponsor = {
  name: string
  website_url: string | null
}

// A busy month should not push the sponsor rotation out of reach. Most months
// come in under this; the cap only bites on unusually full ones.
const MAX_TICKER_EVENTS = 4

// Phase lengths for one ticker item. A wide line travels its own full width at
// a readable pace instead of a fixed duration, so a long event title does not
// whip past faster than a short sponsor name.
const ENTER_MS = 460
const HOLD_MS = 900
// An overflowing line travels at reading pace because the travel is doing
// double duty: revealing the rest of the line and then clearing it. A line
// that already fits has nothing left to read, so it leaves faster.
const MARQUEE_PIXELS_PER_SECOND = 78
const EXIT_PIXELS_PER_SECOND = 115

const CLW_HEADER_ARIA_LABEL = 'Wizards Wrestling sponsorship levels'

// Fallback shown before the database answers, or if the sponsors table has no
// platinum tier yet. Same compound format as the live rows below, so there is
// no visible seam once real data replaces it.
const CLW_HEADER_ITEMS: TickerItem[] = [
  {
    text: 'Platinum Partner • Creative Eye Multimedia',
    kind: 'promo',
    href: '/partners#platinum',
  },
]

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z" />
    </svg>
  )
}

// These run during render, so anything unparseable has to return null rather
// than let Intl throw "RangeError: Invalid time value" and take the ticker
// down. A plain date column gives `YYYY-MM-DD`, but a timestamp column gives
// a full ISO string, and both have to survive.
function formatEventDate(date: string | null) {
  if (!date) return null

  const value = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : date)
  if (Number.isNaN(value.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(value)
}

function formatEventTime(time: string | null) {
  if (!time) return null

  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!match) return null

  const value = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])))
  if (Number.isNaN(value.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(value)
}

/**
 * Everything still to come this calendar month. When the month is empty --
 * either nothing was scheduled or the last one has already passed -- fall
 * through to the single next event on the books, whenever it lands.
 *
 * `candidates` is already filtered to today onward and sorted, and dates are
 * stored as YYYY-MM-DD, so the month test is a string prefix compare.
 */
function selectTickerEvents(candidates: CalendarCandidate[], today: string) {
  const thisMonth = candidates.filter((event) => event.date.slice(0, 7) === today.slice(0, 7))
  return thisMonth.length ? thisMonth.slice(0, MAX_TICKER_EVENTS) : candidates.slice(0, 1)
}

/**
 * Every row gets a leading label, matching the sponsor rows, so the section
 * reads as one group without a separate title item. "Today" and "Tomorrow"
 * take the slot when they apply since they're more useful than "Upcoming" on
 * the two days a bare date doesn't make obvious at a glance; otherwise it's
 * "Upcoming". Deliberately no month-relative wording -- "next month" reads as
 * far away on the 30th when the event is three days out, and the printed
 * date already answers the question.
 */
function eventTickerText(event: CalendarCandidate, today: string, tomorrow: string) {
  const date = formatEventDate(event.date)
  if (!date) return null

  const time = formatEventTime(event.startTime)
  const day = event.date.slice(0, 10)
  const prefix = day === today ? 'Today' : day === tomorrow ? 'Tomorrow' : 'Upcoming'

  return `${prefix} • ${event.title} • ${date}${time ? ` • ${time}` : ''}`
}

export default function ScrollingTicker({
  items = [],
  ariaLabel = 'Updates and offers',
  intervalMs = 4240,
  className = '',
}: ScrollingTickerProps) {
  const isClwHeaderFeed = ariaLabel === CLW_HEADER_ARIA_LABEL
  const reducedMotionRef = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [metrics, setMetrics] = useState({ overflowing: false, travel: 0 })
  const [index, setIndex] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarCandidate[]>([])
  const [platinumSponsors, setPlatinumSponsors] = useState<PlatinumSponsor[]>([])

  useEffect(() => {
    if (!isClwHeaderFeed) return

    // The live calendar is an enhancement on top of the static feed. If the
    // browser client is unavailable, keep the static items rather than
    // throwing out of the effect and blanking every page that has a header.
    const supabase = createOptionalBrowserSupabase()
    if (!supabase) return

    let cancelled = false

    async function loadFeed(client: NonNullable<typeof supabase>) {
      const today = chicagoDateString()
      const [{ data: tournaments }, { data: clubEvents }, { data: sponsors }] = await Promise.all([
        client
          .from('tournaments')
          .select('name,date,start_time')
          .neq('status', 'cancelled')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(8),
        client
          .from('club_events')
          .select('title,date,start_time')
          .eq('active', true)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(8),
        client
          .from('sponsors')
          .select('name,website_url')
          .eq('tier', 'platinum')
          .eq('active', true)
          .order('name', { ascending: true })
          .limit(12),
      ])

      const candidates: CalendarCandidate[] = [
        ...(tournaments ?? []).map((event) => ({
          title: event.name,
          date: event.date,
          startTime: event.start_time,
        })),
        ...(clubEvents ?? []).map((event) => ({
          title: event.title,
          date: event.date,
          startTime: event.start_time,
        })),
      ]
        .filter((event) => Boolean(event.title && event.date))
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return (a.startTime ?? '23:59:59').localeCompare(b.startTime ?? '23:59:59')
        })

      if (cancelled) return

      setUpcomingEvents(selectTickerEvents(candidates, today))
      setPlatinumSponsors(
        (sponsors ?? [])
          .filter((sponsor): sponsor is PlatinumSponsor => Boolean(sponsor?.name))
          .map((sponsor) => ({ name: sponsor.name, website_url: sponsor.website_url ?? null }))
      )
    }

    loadFeed(supabase).catch(() => {
      // A failed calendar lookup just leaves the static feed in place.
    })

    return () => {
      cancelled = true
    }
  }, [isClwHeaderFeed])

  // Platinum sponsors come from the database once it answers. Until then, and
  // if the club has none recorded, the hardcoded fallback keeps the credit
  // that was already on the page. The tier name is folded into every row
  // rather than announced once by a separate title item -- that reads as one
  // group without needing a second exit direction to say so.
  const sponsorItems: TickerItem[] = platinumSponsors.length
    ? platinumSponsors.map((sponsor) => ({
        text: `Platinum Partner • ${sponsor.name}`,
        kind: 'promo' as const,
        href: '/partners#platinum',
      }))
    : CLW_HEADER_ITEMS

  const today = chicagoDateString()
  const tomorrow = chicagoDatePlusDays(1)
  const resolvedEvents = upcomingEvents
    .map((event) => eventTickerText(event, today, tomorrow))
    .filter((text): text is string => Boolean(text))

  const eventItems: TickerItem[] = resolvedEvents.length
    ? resolvedEvents.map((text) => ({ text, kind: 'event' as const, href: '/events' }))
    : [{ text: 'View the club calendar.', kind: 'event' as const, href: '/events' }]

  const feedItems: TickerItem[] = isClwHeaderFeed ? [...sponsorItems, ...eventItems] : items

  const safeItems = feedItems.length ? feedItems : [{ text: 'Add ticker content' }]
  const activeText = (safeItems[index] ?? safeItems[0]).text

  // Decide per item whether it needs to travel. Measured rather than guessed
  // from character count, because the ticker mixes three type treatments and
  // the viewport is fluid.
  useEffect(() => {
    const viewport = viewportRef.current
    const text = textRef.current
    if (!viewport || !text) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMetrics({ overflowing: false, travel: 0 })
      return
    }

    const measure = () => {
      const style = window.getComputedStyle(viewport)
      const padLeft = parseFloat(style.paddingLeft) || 0
      const available = viewport.clientWidth - padLeft - (parseFloat(style.paddingRight) || 0)
      const needed = text.scrollWidth
      const overflowing = needed > available + 2

      // Distance that carries the trailing edge past the viewport's left edge.
      // An overflowing line starts flush left; a line that fits starts centred,
      // so it has further to go. Derived from layout rather than live rects, so
      // a resize mid-travel cannot measure the element's animated position.
      const travel = overflowing ? padLeft + needed : padLeft + (available + needed) / 2

      setMetrics({ overflowing, travel })
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(text)
    return () => observer.disconnect()
  }, [activeText])

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reducedMotionRef.current || safeItems.length < 2) return

    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % safeItems.length),
      intervalMs
    )

    return () => window.clearInterval(id)
  }, [intervalMs, safeItems.length])

  const advance = () => {
    if (!reducedMotionRef.current && safeItems.length > 1) {
      setIndex((current) => (current + 1) % safeItems.length)
    }
  }

  const item = safeItems[index] ?? safeItems[0]
  const isPromo = item.kind === 'promo'
  const isEvent = item.kind === 'event'
  const resolvedAriaLabel = isClwHeaderFeed
    ? 'Wizards Wrestling sponsors and next calendar event'
    : ariaLabel

  const textClassName = [
    styles.text,
    isPromo ? styles.promoText : styles.infoText,
    isPromo ? styles.featuredText : '',
    isEvent ? styles.eventText : '',
    metrics.overflowing ? styles.textScroll : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Every item rises in, holds, then leaves to the left. A lone item skips the
  // exit -- there is nothing to hand off to, and it would clear the bar and
  // leave it blank.
  const shouldExit = safeItems.length > 1
  const pace = metrics.overflowing ? MARQUEE_PIXELS_PER_SECOND : EXIT_PIXELS_PER_SECOND
  const trackStyle = {
    '--ticker-enter': `${ENTER_MS}ms`,
    '--ticker-hold': `${HOLD_MS}ms`,
    '--ticker-exit': `${Math.max(Math.round((metrics.travel / pace) * 1000), 600)}ms`,
    '--ticker-distance': `${metrics.travel}px`,
  } as CSSProperties

  return (
    <section aria-label={resolvedAriaLabel} className={`${styles.card} ${className}`.trim()}>
      <div ref={viewportRef} className={styles.viewport}>
        <div
          key={index}
          aria-hidden="true"
          className={`${styles.row} ${metrics.overflowing ? styles.rowScroll : ''}`.trim()}
          style={trackStyle}
        >
          <div
            className={`${styles.track} ${shouldExit ? styles.trackExit : ''}`.trim()}
            onAnimationEnd={advance}
          >
            <span ref={textRef} className={textClassName}>
              {isPromo ? <Star className={styles.star} /> : null}
              <span className={styles.message}>{item.text}</span>
              {isPromo ? <Star className={`${styles.star} ${styles.starEnd}`} /> : null}
            </span>
          </div>
        </div>

        {item.href ? (
          <Link
            href={item.href}
            className={styles.hitArea}
            aria-label={`${item.text} Open related page.`}
          />
        ) : null}
      </div>

      <ul className={styles.screenReaderOnly}>
        {safeItems.map((tickerItem, itemIndex) => (
          <li key={`${tickerItem.text}-${itemIndex}`}>
            {tickerItem.href ? <Link href={tickerItem.href}>{tickerItem.text}</Link> : tickerItem.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
