import Link from 'next/link'

export function ProgramStructure() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-10 text-clw-white sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:px-16 2xl:px-20 2xl:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_8%,rgba(240,192,32,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-8 select-none font-display text-[10rem] leading-none text-clw-gold/[0.045] sm:text-[13rem] lg:text-[18rem] 2xl:text-[22rem]"
      >
        W
      </span>

      <div className="relative mx-auto max-w-4xl lg:max-w-6xl lg:text-center">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Wizards Program</p>

          <h2 className="mt-3 max-w-3xl uppercase leading-[0.96] text-clw-white lg:mx-auto lg:max-w-none">
            <span className="block font-cond text-[clamp(2.55rem,11vw,5rem)] font-light tracking-[-0.015em] text-clw-white [word-spacing:0.08em] lg:text-[3.8rem] xl:text-[4.25rem] 2xl:text-[5rem]">
              Grouped to develop.
            </span>
            <span className="block font-display text-[clamp(2.7rem,11.5vw,5.15rem)] font-black tracking-[0.012em] text-clw-gold [word-spacing:0.1em] lg:text-[3.9rem] xl:text-[4.4rem] 2xl:text-[5.15rem]">
              Trained to compete.
            </span>
          </h2>

          <div className="mt-4 max-w-3xl space-y-4 text-lg leading-[1.6] text-clw-gray sm:text-xl sm:leading-relaxed lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-10 lg:space-y-0 lg:text-lg lg:leading-[1.65]">
            <p>
              Located in Crystal Lake, Illinois, Wizards Wrestling Club helps young wrestlers grow through structured practice groups, focused coaching, and consistent development at the right pace. Athletes train alongside wrestlers at a similar stage so every session builds the right skills and habits.
            </p>
            <p>
              Throughout the season, practices prepare athletes for tournament weekends, team goals, and the next step in their wrestling journey. Along the way, wrestlers build confidence, discipline, competitive readiness, and the resilience to keep progressing.
            </p>
          </div>

          <Link href="/program" className="mt-5 inline-block font-cond text-lg uppercase tracking-[0.16em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline sm:text-xl">
            Explore the program →
          </Link>
        </div>
      </div>
    </section>
  )
}
