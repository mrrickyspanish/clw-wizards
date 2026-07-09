import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { BrandedPhotoMosaic } from '@/components/marketing/BrandedPhotoMosaic'

export function ProgramIntro() {
  return (
    <section className="section-light relative border-b border-clw-gold/35 bg-[#F7F7F7] px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-24 lg:px-12 lg:pb-16 lg:pt-28 xl:px-16 2xl:px-20">
      <div className="relative mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-3xl lg:flex-1">
          <p className="block font-cond text-sm uppercase tracking-[0.32em] text-clw-gold lg:hidden">
            Wizards Wrestling Club
          </p>
          <h2 className="mt-3 max-w-3xl uppercase leading-[0.96] text-clw-ink lg:mt-0">
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink">
              Where
            </span>
            <span className="block font-cond text-[clamp(3rem,13vw,4.75rem)] font-light tracking-[-0.02em] text-clw-ink">
              McHenry County
            </span>
            <span className="block font-display text-[clamp(3.15rem,13vw,5rem)] font-black tracking-[0.01em] text-clw-ink [word-spacing:0.1em]">
              Wrestlers Grow
            </span>
          </h2>
          <div className="mt-7 max-w-3xl space-y-5 text-xl leading-relaxed text-clw-ink/85 sm:text-2xl sm:leading-relaxed lg:max-w-[26rem] lg:text-lg lg:leading-relaxed">
            <p>
              The Wizards Wrestling Club helps young wrestlers take the next step, whether they are learning the basics or chasing bigger goals. Our club gives kids a place to train hard, build confidence, and represent McHenry County with pride.
            </p>
            <p>
              We are volunteer-run, family-powered, and committed to helping every wrestler grow.
            </p>
          </div>
          <Button asChild size="lg" className="chamfer-sm mt-8 rounded-none">
            <Link href="/join">Ready to become a Wizard? →</Link>
          </Button>
        </div>

        <div className="mt-12 lg:mt-0 lg:w-[48%] lg:flex-shrink-0">
          <BrandedPhotoMosaic
            primary={{ src: '/images/real/clw-wizards-youth-team-photo.jpg', alt: 'Wizards youth wrestlers gathered for a team photo' }}
            top={{ src: '/images/real/clw-wizards-family-photo.jpg', alt: 'Wizards families and wrestlers together' }}
            bottom={{ src: '/images/real/clw-wizards-trio-featured-photo.jpg', alt: 'Three Wizards wrestlers featured together' }}
            caption="Four decades of McHenry County wrestling"
          />
        </div>
      </div>
    </section>
  )
}
