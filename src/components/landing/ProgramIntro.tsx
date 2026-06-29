import Link from 'next/link'

export function ProgramIntro() {
  return (
    <section className="section-light border-y border-clw-gold/35 bg-[#F7F7F7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <h2 className="max-w-3xl uppercase leading-[0.92] text-clw-ink">
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.04em] text-clw-ink">
              Where
            </span>
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.04em] text-clw-ink">
              McHenry County
            </span>
            <span className="block font-display text-[clamp(3.4rem,14vw,5.25rem)] font-black tracking-[-0.035em] text-clw-ink">
              Wrestlers Grow
            </span>
          </h2>
          <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed">
            <p>
              The Wizards help young wrestlers take the next step, whether they are learning the basics or chasing bigger goals. Our club gives kids a place to train hard, build confidence, and represent Crystal Lake with pride.
            </p>
            <p>
              We are volunteer-run, family-powered, and committed to helping every wrestler grow.
            </p>
          </div>
          <Link href="/about" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold-ink underline-offset-4 hover:text-clw-ink hover:underline">
            Ready to become a Wizard? →
          </Link>
        </div>

        <div className="relative min-h-[330px] sm:min-h-[410px] lg:min-h-[460px]">
          <div className="absolute left-0 top-0 h-48 w-[68%] overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/35 sm:h-64 lg:left-10 lg:w-[62%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/team_march2025.jpg"
              alt="Crystal Lake Wizards team standing together"
              className="h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-clw-black/25" />
          </div>

          <div className="absolute bottom-24 right-0 h-52 w-[70%] overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/35 sm:h-72 lg:bottom-28 lg:w-[66%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards wrestling practice room"
              className="h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-clw-black/30" />
          </div>

          <div className="absolute bottom-0 left-1/2 h-24 w-[88%] -translate-x-1/2 overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/35 sm:h-28 lg:h-32 lg:w-[92%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards practice facility"
              className="h-full w-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-clw-black/30" />
          </div>

          <div className="absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 rotate-[-9deg] items-center justify-center rounded-full border-[7px] border-clw-gold bg-clw-black/80 text-center shadow-2xl shadow-black/45 sm:h-56 sm:w-56">
            <div className="rounded-full border border-clw-gold/45 px-6 py-7">
              <span className="block font-cond text-xs uppercase tracking-[0.34em] text-clw-gold/80">Crystal Lake</span>
              <span className="mt-1 block font-display text-5xl uppercase leading-none text-clw-gold sm:text-6xl">Wizards</span>
              <span className="block font-cond text-xs uppercase tracking-[0.3em] text-clw-gold/80">Wrestling Club</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
