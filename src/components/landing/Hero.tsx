import Link from 'next/link'

import { Button } from '@/components/ui/button'

/**
 * Mission-control hero: a contained two-column module, not a full-bleed
 * splash. Text carries the pitch; the photo panel is a single cinematic
 * feature panel (chamfered, corner-ticked) rather than the whole viewport,
 * so the bento grid below reads on the same screen.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-clw-gold/10 bg-clw-black pb-10 pt-28 lg:pb-14">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
          <h1 className="mt-4 max-w-xl font-display text-6xl uppercase leading-[0.95] text-clw-white sm:text-7xl">
            Wrestle like a <span className="text-clw-gold">Wizard</span>.
          </h1>
          <p className="mt-6 max-w-md text-lg text-clw-gray">
            Develop technique, toughness, and team, on and off the mat.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button asChild size="lg" className="chamfer-sm w-full rounded-none sm:w-auto">
              <Link href="/signup">Join the Wizards</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="chamfer-sm w-full rounded-none sm:w-auto">
              <Link href="/login">Parent Portal Login</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="chamfer-lg relative h-[320px] overflow-hidden border border-clw-gold/15 bg-clw-black-2 sm:h-[380px] lg:h-[460px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative placeholder photo, swap for club media */}
            <img
              src="https://picsum.photos/seed/clw-wrestling-mat/1200/1400"
              alt=""
              aria-hidden
              className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-80"
              autoPlay
              muted
              loop
              playsInline
              poster="/hero.jpg"
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/40 to-transparent" />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-3 select-none font-display text-[9rem] leading-none text-clw-gold/[0.12]"
            >
              W
            </span>

            {/* Corner ticks: the one sports-broadcast detail, reserved for this single feature panel. */}
            <span aria-hidden className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-clw-gold/50" />
            <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-clw-gold/50" />
          </div>
        </div>
      </div>
    </section>
  )
}
