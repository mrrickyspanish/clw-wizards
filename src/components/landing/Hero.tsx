import Link from 'next/link'

import { Button } from '@/components/ui/button'

/**
 * Full-bleed hero. Media layering, back to front:
 *   1. real photographic base (picsum placeholder; swap for club photography)
 *   2. optional highlight reel: drop public/hero.mp4 (+ public/hero.jpg poster)
 *      and it plays over the photo; missing files fall back to the poster, then
 *      the photo. No CSS glow blob, no broken-image states.
 *   3. bottom-up scrim so the headline always reads (WCAG AA over photo).
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-clw-black" />
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative placeholder photo, swap for club media */}
        <img
          src="https://picsum.photos/seed/clw-wrestling-mat/1600/900"
          alt=""
          aria-hidden
          className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-40"
        />
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
        <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/85 to-clw-black/40" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-24">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.95] text-clw-white sm:text-7xl">
          Wrestle like a <span className="text-clw-gold">Wizard</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-clw-gray">
          Develop technique, toughness, and team, on and off the mat.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Join the Wizards</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Parent / Staff sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
