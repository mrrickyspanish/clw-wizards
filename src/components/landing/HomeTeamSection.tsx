import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { getSiteContent } from '@/lib/content/get'

export async function HomeTeamSection() {
  const content = await getSiteContent()
  const tonyQuote = content.get('home.tony.quote')
  const tonyPhoto = content.get('home.tony.photo')
  return (
    <section className="section-light relative isolate overflow-hidden border-b border-clw-gold/30 bg-[#E6E6E9] px-5 pb-10 pt-6 text-clw-ink sm:px-8 sm:pb-12 sm:pt-8 lg:px-12 lg:py-14 xl:px-16 2xl:px-20 2xl:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_84%_6%,rgba(240,192,32,.12),transparent_26%)]"
      />

      <div id="team" className="relative mx-auto max-w-7xl scroll-mt-24">
        <header className="max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold-on-light">Why We Started</p>
          <h2 className="mt-3 whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.05rem,8.8vw,5rem)] font-light tracking-[-0.04em] sm:mr-3 sm:text-[3rem] lg:text-[3.7rem] xl:text-[4.2rem] 2xl:text-[5rem]">
              Built on one
            </span>
            <span className="inline font-display text-[clamp(2.25rem,9.6vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold-on-light sm:text-[3.3rem] lg:text-[4rem] xl:text-[4.6rem] 2xl:text-[5.6rem]">
              Belief.
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-clw-muted-dark sm:text-lg lg:text-lg">
            The idea Wizards Wrestling was built on — and the standard behind every practice.
          </p>
        </header>

        <div className="mt-6 grid items-center gap-6 sm:mt-8 sm:gap-8 lg:mt-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 2xl:mt-14 2xl:gap-14">
          <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="chamfer-md relative overflow-hidden border-2 border-clw-gold/60 bg-clw-black-2 shadow-2xl shadow-black/25">
              <div className="relative aspect-[16/11] overflow-hidden sm:aspect-[16/10] lg:aspect-[5/4] 2xl:aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src={tonyPhoto}
                  alt="Coach Tony Fontanetta with Wizards wrestlers at the club banquet"
                  className="h-full w-full origin-[50%_30%] scale-[1.25] object-cover object-[center_32%] contrast-105 saturate-[0.9] sm:scale-[1.3] lg:scale-[1.3] 2xl:scale-[1.55]"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-5 2xl:p-6">
                  <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold sm:tracking-[0.28em]">Founder & Head Coach</p>
                  <p className="mt-1 font-display text-2xl uppercase leading-none text-white sm:text-3xl lg:text-3xl 2xl:text-4xl">Tony Fontanetta</p>
                </figcaption>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- brand star asset */}
            <img
              src="/images/real/clw_star_stamp_yellow_gold.png"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute -left-3 -top-4 h-16 w-16 -rotate-[8deg] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:-left-5 sm:-top-5 sm:h-20 sm:w-20 lg:h-20 lg:w-20 2xl:h-24 2xl:w-24"
            />
          </figure>

          <div>
            <figure className="border-l-2 border-clw-gold/70 pl-5 sm:pl-6">
              <blockquote className="font-body text-xl font-medium leading-snug text-clw-ink sm:text-2xl sm:leading-snug lg:text-2xl 2xl:text-3xl">
                <span aria-hidden className="mr-1 font-display text-clw-gold-on-light">&ldquo;</span>
                {tonyQuote}
              </blockquote>
              <figcaption className="mt-3 font-cond text-sm uppercase tracking-[0.14em] text-clw-muted-dark sm:text-base sm:tracking-[0.18em] 2xl:mt-5">
                Tony Fontanetta — President, Head Coach &amp; Club Coordinator
              </figcaption>
            </figure>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-4 2xl:mt-9">
              <Link
                href="/about"
                className="chamfer-sm inline-flex min-h-11 items-center justify-center gap-2 bg-clw-gold px-5 py-2.5 font-cond text-base uppercase tracking-[0.14em] text-clw-ink transition hover:bg-clw-gold-l sm:min-h-12 sm:px-6 sm:py-3 sm:tracking-[0.16em]"
              >
                Read our mission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coaches"
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-clw-gold-on-light/45 px-5 py-2.5 font-cond text-base uppercase tracking-[0.14em] text-clw-gold-on-light transition hover:border-clw-gold-on-light sm:min-h-12 sm:px-6 sm:py-3 sm:tracking-[0.16em]"
              >
                Meet the coaches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
