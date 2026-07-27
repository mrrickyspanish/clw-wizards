'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import styles from './ScrollingTicker.module.css'

export type TickerItem = {
  text: string
  kind?: 'info' | 'promo'
  href?: string
}

export type ScrollingTickerProps = {
  items: TickerItem[]
  ariaLabel?: string
  intervalMs?: number
  className?: string
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z" />
    </svg>
  )
}

export default function ScrollingTicker({
  items,
  ariaLabel = 'Updates and offers',
  intervalMs = 4240,
  className = '',
}: ScrollingTickerProps) {
  const safeItems: TickerItem[] = items.length ? items : [{ text: 'Add ticker content' }]
  const reducedMotionRef = useRef(false)
  const [index, setIndex] = useState(0)

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

  return (
    <section aria-label={ariaLabel} className={`${styles.card} ${className}`.trim()}>
      <div className={styles.viewport}>
        <div
          key={index}
          aria-hidden="true"
          onAnimationEnd={advance}
          className={styles.row}
          style={{ '--ticker-duration': `${intervalMs}ms` } as CSSProperties}
        >
          <span className={`${styles.text} ${isPromo ? styles.promoText : styles.infoText}`}>
            {isPromo ? (
              <Sparkle className={styles.sparkle} />
            ) : (
              <span className={styles.dot} />
            )}
            {item.text}
          </span>
        </div>

        {item.href ? (
          <Link
            href={item.href}
            className={styles.hitArea}
            aria-label={`${item.text}. View Wizards sponsorship options.`}
          >
            <span aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <ul className={styles.screenReaderOnly}>
        {safeItems.map((tickerItem, itemIndex) => (
          <li key={`${tickerItem.text}-${itemIndex}`}>{tickerItem.text}</li>
        ))}
      </ul>
    </section>
  )
}
