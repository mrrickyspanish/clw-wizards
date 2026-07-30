'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

// Mobile-only conversion bar. The header carries the first-screen CTA, so this
// bar enters after the visitor has moved through most of the hero and exits
// again when the footer becomes available.
export function MobileCtaBar() {
  const [passedHeroTrigger, setPassedHeroTrigger] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const heroTrigger = document.getElementById('mobile-cta-trigger')
    const footer = document.getElementById('site-footer')

    const heroObserver = heroTrigger
      ? new IntersectionObserver(
          ([entry]) => setPassedHeroTrigger(entry.boundingClientRect.top < 0),
          { threshold: 0 }
        )
      : null

    const footerObserver = footer
      ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), {
          threshold: 0.05,
        })
      : null

    if (heroTrigger && heroObserver) heroObserver.observe(heroTrigger)
    if (footer && footerObserver) footerObserver.observe(footer)

    return () => {
      heroObserver?.disconnect()
      footerObserver?.disconnect()
    }
  }, [])

  const visible = passedHeroTrigger && !footerVisible

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[100] border-t border-clw-gold/10 bg-clw-black/95 px-4 pb-3 pt-3 backdrop-blur-md transition-[transform,opacity] duration-300 ease-out [backface-visibility:hidden] [transform:translateZ(0)] motion-reduce:transition-none md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <Button asChild className="flex-1">
          <Link href="/join">Join the Wizards</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
