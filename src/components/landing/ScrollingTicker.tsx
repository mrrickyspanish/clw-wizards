'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { chicagoDateString } from '@/lib/chicago-time'
import { createOptionalBrowserSupabase } from '@/lib/supabase/browser'
import styles from './ScrollingTicker.module.css'

export type TickerItem = {
  text: string
  kind?: 'info' | 'promo'
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

const CLW_HEADER_ARIA_LABEL = 'Wizards Wrestling sponsorship levels'

const CLW_HEADER_ITEMS: TickerItem[] = [
  {
    text: 'Thank you to our Platinum tier sponsors.',
    href: '/partners#platinum',
  },
  {
    text: 'Creative Eye Multimedia',
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

function eventTickerText(event: CalendarCandidate) {
  const date = formatEventDate(event.date)
  if (!date) return null

  const time = formatEventTime(event.startTime)
  return `Next Event • ${event.title} • ${date}${time ? ` • ${time}` : ''}`
}

export default function ScrollingTicker({
  items = [],
  ariaLabel = 'Updates and offers',
  intervalMs = 4240,
  className = '',
}: ScrollingTickerProps) {
  const isClwHeaderFeed = ariaLabel === CLW_HEADER_ARIA_LABEL
  const reducedMotionRef = useRef(false)
  const [index, setIndex] = useState(0)
  const [nextEvent, setNextEvent] = useState<CalendarCandidate | null>(null)

  useEffect(() => {
    if (!isClwHeaderFeed) return

    // The live calendar is an enhancement on top of the static feed. If the
    // browser client is unavailable, keep the static items rather than
    // throwing out of the effect and blanking every page that has a header.
    const supabase = createOptionalBrowserSupabase()
    if (!supabase) return

    let cancelled = false

    async function loadNextEvent(client: NonNullable<typeof supabase>) {
      const today = chicagoDateString()
      const [{ data: tournaments }, { data: clubEvents }] = await Promise.all([
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

      if (!cancelled) setNextEvent(candidates[0] ?? null)
    }

    loadNextEvent(supabase).catch(() => {
      // A failed calendar lookup just leaves the static feed in place.
    })

    return () => {
      cancelled = true
    }
  }, [isClwHeaderFeed])

  const feedItems: TickerItem[] = isClwHeaderFeed
    ? [
        ...CLW_HEADER_ITEMS,
        {
          text:
            (nextEvent && eventTickerText(nextEvent)) || 'Next Event • View the club calendar.',
          href: '/events',
        },
      ]
    : items

  const safeItems = feedItems.length ? feedItems : [{ text: 'Add ticker content' }]

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
  const isEvent = item.text.startsWith('Next Event')
  const resolvedAriaLabel = isClwHeaderFeed
    ? 'Wizards Wrestling sponsors and next calendar event'
    : ariaLabel

  const textClassName = [
    styles.text,
    isPromo ? styles.promoText : styles.infoText,
    isPromo ? styles.featuredText : '',
    isEvent ? styles.eventText : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section aria-label={resolvedAriaLabel} className={`${styles.card} ${className}`.trim()}>
      <div className={styles.viewport}>
        <div
          key={index}
          aria-hidden="true"
          onAnimationEnd={advance}
          className={styles.row}
          style={{ '--ticker-duration': `${intervalMs}ms` } as CSSProperties}
        >
          <span className={textClassName}>
            {isPromo ? <Star className={styles.star} /> : null}
            <span className={styles.message}>{item.text}</span>
            {isPromo ? <Star className={`${styles.star} ${styles.starEnd}`} /> : null}
          </span>
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
