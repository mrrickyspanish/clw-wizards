import Link from 'next/link'

const PROGRAM_POINTS = [
  'Practice groups',
  'Focused coaching',
  'Tournament weekends',
]

export function ProgramStructure() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_8%,rgba(240,192,32,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-8 select-none font-display text-[12rem] leading-none text-clw-gold/[0.045] sm:text-[16rem] lg:text-[22rem]"
      >
        W
      </span>

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative min-h-[330px] sm:min-h-[410px] lg:order-2">
          <div className="absolute left-0 top-0 h-48 w-[68%] overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/35 sm:h-64 lg:left-10 lg:w-[62%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/team_march2025.jpg"
              alt="Crystal Lake Wizards team standing together"
              className="h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-clw-black/25" />
          </div>

          <div className="absolute bottom-0 right-0 h-52 w-[70%] overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/35 sm:h-72 lg:w-[66%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards wrestling practice room"
              className="h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-clw-black/30" />
          </div>

          <div className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 rotate-[-9deg] items-center justify-center rounded-full border-[7px] border-clw-gold bg-clw-black/80 text-center shadow-2xl shadow-black/45 sm:h-56 sm:w-56">
            <div className="rounded-full border border-clw-gold/45 px-6 py-7">
              <span className="block font-cond text-xs uppercase tracking-[0.34em] text-clw-gold/80">Crystal Lake</span>
              <span className="mt-1 block font-display text-6xl uppercase leading-none text-clw-gold sm:text-7xl">CLW</span>
              <span className="block font-cond text-xs uppercase tracking-[0.3em] text-clw-gold/80">Wizards</span>
            </div>
          </div>
        </div>

        <div className="lg:order-1">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">CLW Program</p>

          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white">
            <span className="block font-cond text-[clamp(3.15rem,13vw,5.1rem)] font-light tracking-[-0.04em] text-clw-white">
              Grouped to develop.
            </span>
            <span className="block font-display text-[clamp(3.4rem,14vw,5.55rem)] font-black tracking-[-0.035em] text-clw-white">
              Trained to compete.
            </span>
          </h2>

          <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:max-w-2xl">
            <p>
              Located in Crystal Lake, Illinois, CLW helps young wrestlers grow through structured practice groups, focused coaching, and regular competition opportunities. Wrestlers train with athletes at a similar stage so they can build the right skills, confidence, and discipline at the right pace.
            </p>
            <p>
              Throughout the season, practices prepare our athletes for tournament weekends, team goals, and the next step in their wrestling journey.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
            {PROGRAM_POINTS.map((point) => (
              <div key={point} className="border border-clw-gold/25 bg-clw-black-2/80 px-4 py-4 text-center font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">
                {point}
              </div>
            ))}
          </div>

          <Link href="#groups" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline">
            Explore the program →
          </Link>
        </div>
      </div>
    </section>
  )
}
