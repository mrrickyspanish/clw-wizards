import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function ProgramIntro() {
  return (
    <section className="section-light relative border-y border-clw-gold/35 bg-[#F7F7F7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16 2xl:px-20">
      <div className="relative mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-3xl lg:flex-1">
          <p className="hidden font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-ink lg:block">
            Wizards Wrestling Club
          </p>
          <h2 className="max-w-3xl uppercase leading-[0.92] text-clw-ink lg:mt-3">
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
          <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed lg:max-w-[26rem] lg:text-lg lg:leading-relaxed">
            <p>
              The Wizards help young wrestlers take the next step, whether they are learning the basics or chasing bigger goals. Our club gives kids a place to train hard, build confidence, and represent Crystal Lake with pride.
            </p>
            <p>
              We are volunteer-run, family-powered, and committed to helping every wrestler grow.
            </p>
          </div>
          <Button asChild size="lg" className="chamfer-sm mt-8 rounded-none">
            <Link href="/about">Ready to become a Wizard? →</Link>
          </Button>
        </div>

        <div className="mt-10 lg:mt-0 lg:w-[48%] lg:flex-shrink-0">
          <div className="relative aspect-[5/4] w-full">
            {/* Dominant back-left landscape frame */}
            <div className="absolute left-[3%] top-[4%] z-10 aspect-[3/2] w-[60%] overflow-hidden border border-clw-ink/70 bg-clw-black-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/clw-wizards-youth-team-photo.jpg"
                alt="Crystal Lake Wizards youth wrestlers gathered for a team photo"
                className="h-full w-full object-cover contrast-110 grayscale-0 lg:grayscale"
              />
            </div>

            {/* Secondary lower-right landscape frame */}
            <div className="absolute right-[1%] top-[23%] z-20 aspect-[3/2] w-[52%] overflow-hidden border border-clw-ink/70 bg-clw-black-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/clw-wizards-family-photo.jpg"
                alt="Crystal Lake Wizards families and wrestlers together"
                className="h-full w-full object-cover contrast-110 grayscale-0 lg:grayscale"
              />
            </div>

            {/* Smaller front-left frame crossing both larger images */}
            <div className="absolute left-[12%] top-[43%] z-30 aspect-[4/3] w-[40%] overflow-hidden border border-clw-ink/70 bg-clw-black-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/clw-wizards-trio-featured-photo.jpg"
                alt="Three Crystal Lake Wizards wrestlers featured together"
                className="h-full w-full object-cover contrast-110 grayscale-0 lg:grayscale"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
