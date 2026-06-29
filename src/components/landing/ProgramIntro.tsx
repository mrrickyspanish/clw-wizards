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

        <div className="relative min-h-[360px] sm:min-h-[440px] lg:min-h-[500px]">
          {/* Primary: dominant top-left layer */}
          <div className="absolute left-0 top-0 h-56 w-[64%] overflow-hidden bg-clw-black-2 sm:h-72 lg:h-80 lg:w-[60%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/team_march2025.jpg"
              alt="Crystal Lake Wizards team standing together"
              className="h-full w-full object-cover grayscale contrast-110"
            />
          </div>

          {/* Secondary: supporting layer anchored bottom-left, shallow overlap with primary */}
          <div className="absolute bottom-0 left-0 h-44 w-[46%] overflow-hidden bg-clw-black-2 sm:h-56 lg:h-60 lg:w-[42%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards wrestling practice room"
              className="h-full w-full object-cover grayscale contrast-110"
            />
          </div>

          {/* Accent: single brand-color punctuation at the seam */}
          <span aria-hidden className="absolute left-[58%] top-[16%] z-10 h-10 w-3 bg-clw-gold lg:h-14 lg:w-4" />

          {/* Tertiary: action layer floating inward from the right edge, overlapping both planes */}
          <div className="absolute right-4 top-[30%] h-40 w-[52%] overflow-hidden bg-clw-black-2 sm:h-48 lg:right-8 lg:h-52 lg:w-[48%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards practice facility"
              className="h-full w-full object-cover grayscale contrast-110"
            />
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
