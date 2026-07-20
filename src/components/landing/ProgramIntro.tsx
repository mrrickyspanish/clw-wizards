import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getSiteContent } from '@/lib/content/get'

export async function ProgramIntro() {
  const content = await getSiteContent()
  const body1 = content.get('home.intro.body1')
  const body2 = content.get('home.intro.body2')
  const statYears = content.get('home.intro.stat_years')
  const statWrestlers = content.get('home.intro.stat_wrestlers')
  return (
    <section className="section-light relative border-b border-clw-gold/35 bg-[#F7F7F7] px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12 lg:px-12 lg:pb-16 lg:pt-16 xl:px-16 2xl:px-20">
      <div className="relative mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-3xl lg:flex-1">
          <p className="block font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light lg:hidden">
            Wizards Wrestling Club
          </p>
          <h2 className="mt-3 max-w-3xl uppercase leading-[0.96] text-clw-ink lg:mt-0">
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink">
              Where
            </span>
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink">
              McHenry County
            </span>
            <span className="block font-display text-[clamp(3.15rem,13vw,5rem)] font-black tracking-[0.01em] text-clw-ink [word-spacing:0.1em]">
              Wrestlers Grow
            </span>
          </h2>
          <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed lg:max-w-[26rem] lg:text-lg lg:leading-relaxed">
            <p>{body1}</p>
            <p>{body2}</p>
          </div>
          <Button asChild size="lg" className="chamfer-sm mt-8 rounded-none">
            <Link href="/program">Explore the program →</Link>
          </Button>
        </div>

        <div className="mt-14 lg:mt-0 lg:w-[48%] lg:flex-shrink-0">
          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
            {/* Primary proof: Wizards wrestlers on the mat, framed and branded with
                an inline club-record strip so the photo reads as evidence, not decoration. */}
            <figure className="chamfer-md card-depth relative border border-clw-ink/15 bg-clw-black-2 shadow-2xl shadow-black/25">
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-trio-featured-photo.jpg"
                  alt="Three young Wizards wrestlers in club gear at an IKWF state-series tournament"
                  className="h-full w-full object-cover object-center contrast-105"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_0_1px_rgba(17,17,17,0.14)]" />
              </div>
              <figcaption className="grid grid-cols-3 border-t-2 border-clw-gold bg-clw-ink text-center">
                <div className="border-r border-white/10 px-2 py-4">
                  <p className="font-display text-2xl leading-none text-clw-gold sm:text-3xl">{statYears}</p>
                  <p className="mt-1.5 font-cond text-sm uppercase tracking-[0.12em] text-white/70">Years</p>
                </div>
                <div className="border-r border-white/10 px-2 py-4">
                  <p className="font-display text-2xl leading-none text-clw-gold sm:text-3xl">IKWF</p>
                  <p className="mt-1.5 font-cond text-sm uppercase tracking-[0.12em] text-white/70">Registered</p>
                </div>
                <div className="px-2 py-4">
                  <p className="font-display text-2xl leading-none text-clw-gold sm:text-3xl">{statWrestlers}</p>
                  <p className="mt-1.5 font-cond text-sm uppercase tracking-[0.12em] text-white/70">Wrestlers</p>
                </div>
              </figcaption>
            </figure>

            {/* Brand mark stamped over the frame corner. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- brand star asset */}
            <img
              src="/images/real/clw_star_stamp_yellow_gold.png"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute -right-4 -top-5 h-20 w-20 rotate-[8deg] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] sm:-right-6 sm:-top-6 sm:h-24 sm:w-24"
            />

            {/* Secondary proof: hardware. One deliberate overlap for depth,
                seated above the record strip so no stat is covered. */}
            <figure className="absolute bottom-24 -left-5 w-[44%] max-w-[200px] sm:bottom-28 sm:-left-7">
              <div className="chamfer-sm overflow-hidden border-2 border-clw-gold bg-clw-black-2 shadow-xl shadow-black/40">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                  <img
                    src="/images/real/clw-wizards-youth-win.jpg"
                    alt="Wizards youth team holding a tournament trophy"
                    className="h-full w-full object-cover object-center contrast-105"
                  />
                </div>
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
