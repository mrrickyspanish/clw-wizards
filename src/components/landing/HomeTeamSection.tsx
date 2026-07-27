import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { getSiteContent } from '@/lib/content/get'

export async function HomeTeamSection() {
  const content = await getSiteContent()
  const tonyQuote = content.get('home.tony.quote')
  const tonyPhoto = content.get('home.tony.photo')
  return (
    <section className="section-light relative isolate overflow-hidden border-b border-clw-gold/30 bg-[#E6E6E9] px-5 pt-6 pb-14 text-clw-ink sm:px-8 sm:pt-8 sm:pb-16 lg:px-12 lg:pt-10 lg:pb-20 xl:px-16 2xl:px-20">
      {/* faint gold wash for warmth on the gray band; grain comes from .section-light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_84%_6%,rgba(240,192,32,.12),transparent_26%)]"
      />

      <div id="team" className="relative mx-auto max-w-7xl scroll-mt-24">
        <header className="max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light">Why We Started</p>
          <h2 className="mt-4 whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.2rem,9.5vw,5rem)] font-light tracking-[-0.04em] sm:mr-3">
              Built on one
            </span>
            <span className="inline font-display text-[clamp(2.45rem,10.5vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold-on-light">
              Belief.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-clw-muted-dark sm:text-xl">
            The idea Wizards Wrestling was built on — and the standard behind every practice.
          </p>
        </header>

        <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          {/* Coach Tony — branded, framed portrait */}
          <figure className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="chamfer-md relative overflow-hidden border-2 border-clw-gold/60 bg-clw-black-2 shadow-2xl shadow-black/25">
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src={tonyPhoto}
                  alt="Coach Tony Fontanetta with Wizards wrestlers at the club banquet"
                  className="h-full w-full origin-[50%_30%] scale-[1.55] object-cover object-center contrast-105 saturate-[0.9]"
                />
                {/* dark scrim on the image (literal black, not the palette token) so the
                    caption stays legible regardless of the section's light palette */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Founder & Head Coach</p>
                  <p className="mt-1.5 font-display text-3xl uppercase leading-none text-white sm:text-4xl">Tony Fontanetta</p>
                </figcaption>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- brand star asset */}
            <img
              src="/images/real/clw_star_stamp_yellow_gold.png"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute -left-4 -top-5 h-20 w-20 -rotate-[8deg] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:-left-6 sm:-top-6 sm:h-24 sm:w-24"
            />
          </figure>

          {/* Philosophy + links */}
          <div>
            <figure className="border-l-2 border-clw-gold/70 pl-6">
              <blockquote className="font-body text-2xl font-medium leading-snug text-clw-ink sm:text-3xl sm:leading-snug">
                <span aria-hidden className="mr-1 font-display text-clw-gold-on-light">&ldquo;</span>
                {tonyQuote}
              </blockquote>
              <figcaption className="mt-5 font-cond text-base uppercase tracking-[0.18em] text-clw-muted-dark">
                Tony Fontanetta — President, Head Coach &amp; Club Coordinator
              </figcaption>
            </figure>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/about"
                className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-ink transition hover:bg-clw-gold-l"
              >
                Read our mission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coaches"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-gold-on-light/45 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold-on-light transition hover:border-clw-gold-on-light"
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
