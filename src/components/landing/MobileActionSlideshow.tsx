'use client'

import { useEffect, useState } from 'react'

const SLIDES = [
  '/images/real/team_march2025.jpg',
  '/images/real/facility_pano.jpg',
  '/images/real/coaches_trophy.jpg',
]

const INTERVAL_MS = 3200

export function MobileActionSlideshow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section aria-hidden className="relative h-64 w-full overflow-hidden bg-clw-black-2 sm:h-72 md:hidden">
      <span className="absolute inset-x-0 top-0 z-10 h-px bg-clw-gold/70" />
      {SLIDES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover grayscale transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/25 to-transparent" />
      <p className="absolute left-5 top-4 font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">
        Wizards in action
      </p>
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
        {SLIDES.map((src, i) => (
          <span
            key={src}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${i === active ? 'bg-clw-gold' : 'bg-clw-white/30'}`}
          />
        ))}
      </div>
    </section>
  )
}
