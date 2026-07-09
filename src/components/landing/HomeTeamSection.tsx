import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Placeholder philosophy quote in Tony's voice, grounded in the club's existing
// mission language. Confirm / replace with Coach Tony's own words before launch.
const TONY_QUOTE =
  'I started this club to give McHenry County kids a room where they get pushed hard and supported harder. We build tough, confident kids first — the wins take care of themselves.'

export function HomeTeamSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_82%_4%,rgba(240,192,32,.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="team" className="relative mx-auto max-w-7xl scroll-mt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          {/* Coach Tony — branded, framed portrait */}
          <figure className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="chamfer-md relative overflow-hidden border-2 border-clw-gold/60 bg-clw-black-2 shadow-2xl shadow-black/40">
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-youth-banquet-tony.jpg"
                  alt="Coach Tony Fontanetta with Wizards wrestlers at the club banquet"
                  className="h-full w-full origin-[50%_30%] scale-[1.55] object-cover object-center contrast-105 saturate-[0.9]"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-clw-black via-clw-black/25 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Founder & Head Coach</p>
                  <p className="mt-1.5 font-display text-3xl uppercase leading-none text-clw-white sm:text-4xl">Tony Fontanetta</p>
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
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Why We Started</p>
            <h2 className="mt-5 uppercase leading-[0.94] text-clw-white">
              <span className="block font-cond text-[clamp(2.4rem,7vw,4rem)] font-light tracking-[-0.02em]">Built on one</span>
              <span className="block font-display text-[clamp(2.7rem,7.6vw,4.6rem)] font-black tracking-[-0.01em] text-clw-gold">Belief.</span>
            </h2>

            <figure className="mt-8 border-l-2 border-clw-gold/70 pl-6">
              <blockquote className="font-body text-2xl font-medium leading-snug text-clw-white sm:text-3xl sm:leading-snug">
                <span aria-hidden className="mr-1 font-display text-clw-gold">&ldquo;</span>
                {TONY_QUOTE}
              </blockquote>
              <figcaption className="mt-5 font-cond text-base uppercase tracking-[0.18em] text-clw-gray">
                Tony Fontanetta — President, Head Coach &amp; Club Coordinator
              </figcaption>
            </figure>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/about"
                className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
              >
                Read our mission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coaches"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-gold/40 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold transition hover:border-clw-gold hover:text-clw-gold-l"
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
