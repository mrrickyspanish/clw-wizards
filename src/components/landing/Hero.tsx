import Link from 'next/link'

import { Button } from '@/components/ui/button'

/**
 * Mission-control hero: full-bleed horizontally like a premium sports landing
 * page. The text stays on a safe internal grid while the media and panel chrome
 * run edge to edge.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-clw-gold/10 bg-clw-black pt-24 md:pt-28">
      <div className="relative min-h-[560px] overflow-hidden bg-clw-black-2">
        <div className="absolute inset-0 lg:left-[34%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative placeholder photo, swap for club media */}
          <img
            src="https://picsum.photos/seed/clw-wrestling-mat/2200/1000"
            alt=""
            aria-hidden
            className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-85"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpg"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-clw-black-2 via-clw-black-2/70 to-clw-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black-2/95 via-clw-black/25 to-clw-black/30" />
        </div>

        <div className="relative z-10 flex min-h-[560px] max-w-4xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <p className="font-cond text-sm uppercase tracking-[0.34em] text-clw-gold">Crystal Lake, Illinois</p>
          <h1 className="mt-4 max-w-3xl font-display text-6xl uppercase leading-[0.88] text-clw-white sm:text-7xl lg:text-8xl xl:text-9xl">
            Wrestle like a <span className="text-clw-gold">Wizard</span>.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-clw-gray">
            Develop technique, toughness, and team, on and off the mat.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button asChild size="lg" className="chamfer-sm h-12 w-full rounded-none px-8 sm:w-auto">
              <Link href="/signup">Join the Wizards</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="chamfer-sm h-12 w-full rounded-none px-8 sm:w-auto">
              <Link href="/login">Parent Portal Login</Link>
            </Button>
          </div>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-6 select-none font-display text-[11rem] leading-none text-clw-gold/[0.1] lg:right-10 lg:text-[14rem]"
        >
          W
        </span>
        <span aria-hidden className="absolute left-5 top-5 h-5 w-5 border-l-2 border-t-2 border-clw-gold/50" />
        <span aria-hidden className="absolute bottom-5 right-5 h-5 w-5 border-b-2 border-r-2 border-clw-gold/50" />
      </div>
    </section>
  )
}
