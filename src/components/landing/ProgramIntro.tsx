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

        <div className="mt-10 lg:mt-0 lg:w-[52%] lg:flex-shrink-0">
          <div className="chamfer-lg overflow-hidden border border-clw-ink/20 bg-clw-black p-2 shadow-2xl shadow-clw-black/15 sm:p-3">
            <div className="grid gap-1 bg-clw-gold sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
              <figure className="group relative min-h-[290px] overflow-hidden bg-clw-black sm:col-span-2 sm:min-h-[360px] lg:col-span-8 lg:row-span-2 lg:min-h-[440px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-action-photo-.jpg"
                  alt="A Crystal Lake Wizards wrestler competing on the mat"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clw-black/80 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-clw-white sm:p-6">
                  <span className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">The work</span>
                  <span className="font-display text-4xl uppercase leading-none">01</span>
                </figcaption>
              </figure>

              <figure className="group relative min-h-[210px] overflow-hidden bg-clw-black lg:col-span-4 lg:min-h-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-youth-team-photo.jpg"
                  alt="Crystal Lake Wizards youth wrestlers gathered as a team"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clw-black/75 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-clw-white">
                  <span className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">The team</span>
                  <span className="font-display text-3xl uppercase leading-none">02</span>
                </figcaption>
              </figure>

              <figure className="group relative min-h-[210px] overflow-hidden bg-clw-black lg:col-span-4 lg:min-h-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
                <img
                  src="/images/real/clw-wizards-family-photo.jpg"
                  alt="Crystal Lake Wizards families and wrestlers together"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-clw-black/75 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-clw-white">
                  <span className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">The family</span>
                  <span className="font-display text-3xl uppercase leading-none">03</span>
                </figcaption>
              </figure>
            </div>

            <div className="flex items-center justify-between gap-4 bg-clw-black px-3 pb-1 pt-3 text-clw-white sm:px-4 sm:pt-4">
              <span className="font-cond text-xs uppercase tracking-[0.3em] text-clw-gray sm:text-sm">
                Crystal Lake, Illinois
              </span>
              <span aria-hidden className="font-display text-4xl leading-none text-clw-gold">W</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
