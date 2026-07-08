'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

export function SectionSlideOver({
  background,
  foreground,
}: {
  background: ReactNode
  foreground: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const backgroundEl = backgroundRef.current
    const shade = shadeRef.current

    if (!root || !backgroundEl || !shade) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const update = () => {
      frame = 0

      if (reduceMotion.matches) {
        backgroundEl.style.transform = 'none'
        shade.style.opacity = '0'
        return
      }

      const rect = root.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / travel))
      const drift = -window.innerHeight * 0.045 * progress
      const scale = 1 + 0.035 * progress

      backgroundEl.style.transform = `translate3d(0, ${drift}px, 0) scale(${scale})`
      shade.style.opacity = String(progress * 0.18)
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    reduceMotion.addEventListener('change', requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      reduceMotion.removeEventListener('change', requestUpdate)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative isolate">
      <div className="sticky top-0 z-0 min-h-[100svh] overflow-hidden">
        <div
          ref={backgroundRef}
          className="min-h-[100svh] origin-center will-change-transform"
        >
          {background}
        </div>
        <div
          ref={shadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black opacity-0 will-change-[opacity]"
        />
      </div>
      <div className="relative z-10">{foreground}</div>
    </div>
  )
}
