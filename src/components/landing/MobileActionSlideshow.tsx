'use client'

import { useEffect, useState } from 'react'

// Placeholder action shots standing in for real club photography. Swap each
// path for a shot from public/images/real once it exists — the slideshow
// mechanism itself doesn't need to change.
const SLIDES = [
  '/images/placeholders/wrestling_training_session_in_action.jpg',
  '/images/placeholders/youth_wrestling_practice_in_full_swing.jpg',
  '/images/placeholders/coaching_moment_in_wrestling_gym.jpg',
  '/images/placeholders/wrestling_practice_in_a_school_gym.jpg',
  '/images/placeholders/team_celebration_in_wrestling_gym.jpg',
  '/images/placeholders/youth_wrestling_practice_during_school_session.jpg',
  '/images/placeholders/wrestling_team_conversation_in_the_gym.jpg',
]

const INTERVAL_MS = 3200

/**
 * Mobile-only, full-bleed crossfade carousel. Hidden at md+ — desktop gets
 * its own treatment later, this is mobile-scoped on purpose.
 */
export function MobileActionSlideshow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section aria-hidden className="relative h-64 w-full overflow-hidden bg-clw-black-2 sm:h-72 md:hidden">
      <span className="absolute inset-x-0 top-0 z-10 h-[2px] bg-clw-gold/60" />
      {SLIDES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- placeholder action shots, swap for real photos later
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/10 to-transparent" />
      <p className="absolute left-5 top-4 font-cond text-xs uppercase tracking-[0.3em] text-clw-gold">
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
