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
    <section className="section-light relative border-b border-clw-gold/35 bg-[#F7F7F7] px-5 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-8 lg:px-12 lg:py-12 xl:px-16 2xl:px-20 2xl:py-16">
      <div className="relative mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-center lg:gap-10 2xl:gap-14">
        <div className="max-w-3xl lg:flex-1">
          <h2 className="max-w-3xl uppercase leading-[0.96] text-clw-ink">
            <span className="block font-cond text-[clamp(2.5rem,11vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink lg:text-[3.7rem] xl:text-[4.1rem] 2xl:text-[4.75rem]">
              Where
            </span>
            <span className="block font-cond text-[clamp(2.5rem,11vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink lg:text-[3.7rem] xl:text-[4.1rem] 2xl:text-[4.75rem]">
              McHenry County
            </span>
            <span className="block font-display text-[clamp(2.7rem,11.5vw,5rem)] font-black tracking-[0.01em] text-clw-ink [word-spacing:0.1em] lg:text-[3.9rem] xl:text-[4.35rem] 2xl:text-[5rem]">
              Wrestlers Grow
            </span>
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-lg leading-[1.6] text-clw-ink/85 sm:text-xl sm:leading-relaxed lg:max-w-[28rem] lg:text-[1.05rem] lg:leading-[1.65]">
            <p>{body1}</p>
            <p>{body2}</p>
          </div>
          <Button asChild size="lg" className="chamfer-sm mt-5 rounded-none">
            <Link href="/program">Explore the program →</Link>
          </Button>
        </div>

        <div className="mt-8 lg:mt-0 lg:w-[48%] lg:flex-shrink-0">
          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
            <figure className="chamfer-md card-depth relative border border-clw-ink/15 bg-clw-black-2 shadow-2xl shadow-black/25">
              <div className="relative h-[15rem] overflow-hidden sm:h-[18rem] lg:h-[20rem] xl:h-[22rem] 2xl:h-[27rem]">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-trio-featured-photo.jpg"
                  alt="Three young Wizards wrestlers in club gear at an IKWF state-series tournament"
                  className="h-full w-full object-cover object-[center_18%] contrast-105 lg:object-[center_20%]"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_0_1px_rgba(17,17,17,0.14)]" />
              </div>
              <figcaption className="grid grid-cols-3 border-t-2 border-clw-gold bg-clw-ink text-center">
                <div className="border-r border-white/10 px-1.5 py-2.5 sm:px-2 sm:py-3 2xl:py-4">
                  <p className="font-display text-xl leading-none text-clw-gold sm:text-2xl 2xl:text-3xl">{statYears}</p>
                  <p className="mt-1 font-cond text-sm uppercase tracking-[0.1em] text-white/70">Years</p>
                </div>
                <div className="border-r border-white/10 px-1.5 py-2.5 sm:px-2 sm:py-3 2xl:py-4">
                  <p className="font-display text-xl leading-none text-clw-gold sm:text-2xl 2xl:text-3xl">IKWF</p>
                  <p className="mt-1 font-cond text-sm uppercase tracking-[0.1em] text-white/70">Registered</p>
                </div>
                <div className="px-1.5 py-2.5 sm:px-2 sm:py-3 2xl:py-4">
                  <p className="font-display text-xl leading-none text-clw-gold sm:text-2xl 2xl:text-3xl">{statWrestlers}</p>
                  <p className="mt-1 font-cond text-sm uppercase tracking-[0.1em] text-white/70">Wrestlers</p>
                </div>
              </figcaption>
            </figure>

            {/* eslint-disable-next-line @next/next/no-img-element -- brand star asset */}
            <img
              src="/images/real/clw_star_stamp_yellow_gold.png"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute -right-3 -top-4 h-16 w-16 rotate-[8deg] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)] sm:-right-5 sm:-top-5 sm:h-20 sm:w-20 lg:h-20 lg:w-20 2xl:h-24 2xl:w-24"
            />

            <figure className="absolute bottom-16 -left-3 w-[38%] max-w-[140px] sm:bottom-20 sm:-left-5 sm:max-w-[165px] lg:bottom-20 lg:w-[38%] lg:max-w-[170px] 2xl:bottom-24 2xl:w-[42%] 2xl:max-w-[200px]">
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
