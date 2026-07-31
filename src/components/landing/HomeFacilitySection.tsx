import { MapPin, Navigation } from 'lucide-react'

import { getSiteContent } from '@/lib/content/get'
import { CTA_BUTTON } from '@/lib/cta'

export async function HomeFacilitySection() {
  const content = await getSiteContent()
  const body = content.get('home.facility.body')
  const photo = content.get('facility.photo')
  const addressLine1 = content.get('facility.address_line1')
  const addressLine2 = content.get('facility.address_line2')
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressLine1} ${addressLine2}`)}`
  return (
    <section className="section-light relative isolate overflow-hidden border-y border-clw-gold/25 bg-[#F7F7F7] px-5 py-10 text-clw-ink sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:px-16 2xl:px-20 2xl:py-20">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,rgba(255,255,255,.86),transparent_48%),radial-gradient(circle_at_14%_10%,rgba(240,192,32,.12),transparent_26%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 select-none font-display text-[10rem] leading-none text-clw-gold/[0.06] sm:text-[13rem] lg:text-[18rem] 2xl:text-[22rem]"
      >
        W
      </span>

      <div id="location" className="relative mx-auto grid max-w-7xl scroll-mt-32 gap-6 sm:gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-10 2xl:gap-14">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold-on-light">Location</p>
          <h2 className="mt-3 whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.05rem,8.8vw,5rem)] font-light tracking-[-0.04em] sm:mr-3 sm:text-[3rem] lg:text-[3.7rem] xl:text-[4.2rem] 2xl:text-[5rem]">
              Visit the
            </span>
            <span className="inline font-display text-[clamp(2.25rem,9.6vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold-on-light sm:text-[3.3rem] lg:text-[4rem] xl:text-[4.6rem] 2xl:text-[5.6rem]">
              Facility
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-[1.6] text-clw-muted-dark sm:text-xl sm:leading-relaxed lg:text-lg lg:leading-[1.65] 2xl:mt-6 2xl:text-[1.15rem]">
            {body}
          </p>
        </div>

        <div className="overflow-hidden border border-clw-ink/20 bg-clw-black shadow-2xl shadow-black/15">
          <div className="h-48 overflow-hidden sm:h-64 lg:h-[18rem] xl:h-[20rem] 2xl:h-[24rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club facility photo */}
            <img
              src={photo}
              alt="Wizards Wrestling training facility in Crystal Lake"
              className="h-full w-full object-cover contrast-105 saturate-[0.72]"
            />
          </div>

          <div className="grid gap-3 border-t border-clw-gold/30 bg-clw-black px-4 py-4 text-clw-white sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-5 sm:py-5 2xl:gap-6 2xl:px-7 2xl:py-7">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-clw-gold/40 bg-clw-gold/10 text-clw-gold-on-light sm:h-11 sm:w-11">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-cond text-sm uppercase tracking-[0.18em] text-clw-gold-on-light sm:tracking-[0.24em]">Wizards Wrestling Club</p>
                <p className="mt-1 text-base font-semibold leading-snug text-clw-white sm:text-xl">{addressLine1}</p>
                <p className="text-sm leading-relaxed text-clw-gray sm:text-lg">{addressLine2}</p>
              </div>
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${CTA_BUTTON} bg-clw-gold text-clw-ink hover:bg-clw-gold-l sm:min-w-44`}
            >
              <Navigation className="h-4 w-4" />
              Get directions
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
