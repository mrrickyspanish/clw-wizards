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

        <div className="relative mt-10 lg:mt-0 lg:w-[48%] lg:flex-shrink-0">
          <div className="relative min-h-[300px] sm:min-h-[360px] lg:min-h-[400px]">
            {/* Photo 1: largest, top-left */}
            <div className="absolute left-0 top-0 w-[58%] overflow-hidden bg-clw-black-2 aspect-[4/3] lg:w-[64%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/team_march2025.jpg"
                alt="Crystal Lake Wizards team standing together"
                className="h-full w-full object-cover grayscale contrast-110"
              />
            </div>

            {/* Photo 2: mid-size, bottom-right, overlapping photo 1 */}
            <div className="absolute bottom-6 right-0 w-[46%] overflow-hidden bg-clw-black-2 aspect-[3/2] sm:bottom-10 lg:bottom-2 lg:w-[52%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/facility_pano.jpg"
                alt="Crystal Lake Wizards wrestling practice room"
                className="h-full w-full object-cover grayscale contrast-110"
              />
            </div>

            {/* Photo 3: smallest, bottom-left, overlapping the seam */}
            <div className="absolute bottom-0 left-[6%] w-[36%] overflow-hidden bg-clw-black-2 aspect-[16/10] sm:left-[10%] lg:left-[24%] lg:w-[44%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src="/images/real/facility_pano.jpg"
                alt="Crystal Lake Wizards practice facility"
                className="h-full w-full object-cover grayscale contrast-110"
              />
            </div>

            {/* Yellow accent block at the seam between photos 1 and 2, desktop only */}
            <span aria-hidden className="hidden lg:absolute lg:right-[44%] lg:top-[36%] lg:block lg:h-10 lg:w-10 lg:bg-clw-gold" />
          </div>
        </div>
      </div>
    </section>
  )
}
