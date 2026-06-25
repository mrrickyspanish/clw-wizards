import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

/**
 * Full-bleed cinematic hero. Media layering, back to front:
 *   1. base gradient + gold glow + vignette (always painted, looks intentional
 *      with no assets)
 *   2. optional <video> reel — drop `public/hero.mp4` (+ `public/hero.jpg`
 *      poster) and it plays over the gradient; missing files degrade silently
 *      to the poster, then to the gradient. No broken-image states.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* base */}
        <div className="absolute inset-0 bg-clw-black" />
        {/* highlight reel (no-op until public/hero.mp4 exists) */}
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero.jpg"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* gold glow */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_30%,rgba(240,192,32,0.18),transparent_60%)]" />
        {/* bottom-up scrim so text always reads */}
        <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/80 to-clw-black/30" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-24">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.95] text-clw-white sm:text-8xl">
          Wrestle like a <span className="text-clw-gold">Wizard</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-clw-gray">{ORG.tagline}. Develop technique, toughness, and team — on and off the mat.</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Join the Wizards</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Parent / Staff sign in</Link>
          </Button>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-clw-gold/70 transition-colors hover:text-clw-gold"
        aria-label="Scroll to learn more"
      >
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </a>
    </section>
  )
}
