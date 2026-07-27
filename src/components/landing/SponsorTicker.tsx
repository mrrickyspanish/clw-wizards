'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import type { Sponsor } from '@/types/database'
import styles from './SponsorTicker.module.css'

type SponsorTickerProps = {
  sponsors: Sponsor[]
  intervalMs?: number
  className?: string
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={styles.star}>
      <path d="m12 2.4 2.68 5.43 5.99.87-4.34 4.23 1.03 5.97L12 16.08 6.64 18.9l1.03-5.97L3.33 8.7l5.99-.87L12 2.4Z" />
    </svg>
  )
}

function SponsorMark({ sponsor }: { sponsor: Sponsor }) {
  if (sponsor.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- sponsor logos may come from arbitrary external hosts
      <img src={sponsor.logo_url} alt="" className={styles.logo} />
    )
  }

  const initials = sponsor.name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return <span className={styles.monogram}>{initials}</span>
}

function SponsorContent({ sponsor }: { sponsor: Sponsor }) {
  const content: ReactNode = (
    <span className={styles.sponsorRow}>
      <SponsorMark sponsor={sponsor} />
      <span className={styles.sponsorName}>{sponsor.name}</span>
    </span>
  )

  if (!sponsor.website_url) return content

  return (
    <a
      href={sponsor.website_url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      aria-label={`Visit ${sponsor.name}`}
    >
      {content}
    </a>
  )
}

export function SponsorTicker({ sponsors, intervalMs = 4400, className = '' }: SponsorTickerProps) {
  const reducedMotionRef = useRef(false)
  const [index, setIndex] = useState(0)
  const safeSponsors = sponsors.length ? sponsors : []

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reducedMotionRef.current || safeSponsors.length < 2) return

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSponsors.length)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [intervalMs, safeSponsors.length])

  const advance = () => {
    if (!reducedMotionRef.current && safeSponsors.length > 1) {
      setIndex((current) => (current + 1) % safeSponsors.length)
    }
  }

  const sponsor = safeSponsors[index]

  return (
    <section aria-label="Wizards Wrestling Club sponsors" className={`${styles.shell} ${className}`.trim()}>
      <div className={styles.labelRow}>
        <span className={styles.eyebrow}>Community partners</span>
        <Star />
        <a href="/sponsorship" className={styles.cta}>Sponsor CLW</a>
      </div>

      <div className={styles.viewport}>
        {sponsor ? (
          <div
            key={sponsor.id}
            aria-hidden="true"
            onAnimationEnd={advance}
            className={styles.motionRow}
            style={{ '--ticker-duration': `${intervalMs}ms` } as CSSProperties}
          >
            <SponsorContent sponsor={sponsor} />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Star />
            <span>Backing the next generation of Wizards</span>
          </div>
        )}
      </div>

      {safeSponsors.length > 0 && (
        <ul className={styles.screenReaderOnly}>
          {safeSponsors.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
