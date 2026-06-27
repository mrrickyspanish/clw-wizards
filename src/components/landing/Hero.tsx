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
      <div className="relative min-h-[480px] overflow-hidden bg-clw-black-2 lg:min-h-[560px]">
        <div className="absolute inset-0 lg:left-[34%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club team photo */}
          <img
            src="/images/real/team_march2025.jpg"
            alt=""
            aria-hidden
            className="animate-kenburns absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero.jpg"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-clw-black-2/80 via-clw-black-2/45 to-clw-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black-2/75 via-clw-black/10 to-clw-black/10" />
        </div>

        <div className="relative z-10 flex max-w-4xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 lg:min-h-[560px]">
          <p className="hidden font-cond text-sm uppercase tracking-[0.34em] text-clw-gold md:block">
            Crystal Lake Wizards Wrestling Club
          </p>
          <h1 className="max-w-3xl font-display text-[4.5rem] uppercase leading-[0.88] text-clw-white sm:text-[5.4rem] md:mt-4 lg:text-[7.2rem] xl:text-[9.6rem]">
            Wrestle like a <span className="text-clw-gold">Wizard</span>.
          </h1>
          <div className="mt-9 hidden gap-3 md:flex md:items-center md:gap-4">
            <Button asChild size="lg" className="chamfer-sm h-12 rounded-none px-8">
              <Link href="/signup">Join the Wizards</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="chamfer-sm h-12 rounded-none px-8">
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

      <p className="px-5 py-4 font-cond text-sm uppercase tracking-[0.34em] text-clw-gold sm:px-8 md:hidden">
        Crystal Lake Wizards Wrestling Club
      </p>
    </section>
  )
}
