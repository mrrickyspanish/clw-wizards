import { MapPin, Navigation } from 'lucide-react'

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'

export function HomeFacilitySection() {
  return (
    <section className="section-light relative isolate overflow-hidden border-y border-clw-gold/25 bg-[#F7F7F7] px-5 py-14 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,rgba(255,255,255,.86),transparent_48%),radial-gradient(circle_at_14%_10%,rgba(240,192,32,.12),transparent_26%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 select-none font-display text-[12rem] leading-none text-clw-gold/[0.06] sm:text-[16rem] lg:text-[22rem]"
      >
        W
      </span>

      <div id="location" className="relative mx-auto grid max-w-7xl scroll-mt-32 gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light">Location</p>
          <h2 className="mt-6 whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.2rem,9.5vw,5rem)] font-light tracking-[-0.04em] sm:mr-3">
              Visit the
            </span>
            <span className="inline font-display text-[clamp(2.45rem,10.5vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold-on-light">
              Facility
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-muted-dark sm:text-2xl sm:leading-relaxed lg:text-[1.15rem]">
            Centrally located in Crystal Lake, our training space is built to be the easy choice for McHenry County wrestlers.
            Convenient access means more time on the mat and less time in the car.
          </p>
        </div>

        <div className="overflow-hidden border border-clw-ink/20 bg-clw-black shadow-2xl shadow-black/15">
          <div className="h-64 overflow-hidden sm:h-80 lg:h-[24rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club facility photo */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Wizards Wrestling training facility in Crystal Lake"
              className="h-full w-full object-cover contrast-105 saturate-[0.72]"
            />
          </div>

          <div className="grid gap-6 border-t border-clw-gold/30 bg-clw-black px-5 py-6 text-clw-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-7 sm:py-7">
            <div className="flex min-w-0 items-start gap-4">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-clw-gold/40 bg-clw-gold/10 text-clw-gold-on-light">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-cond text-xs uppercase tracking-[0.24em] text-clw-gold-on-light">Wizards Wrestling Club</p>
                <p className="mt-2 text-lg font-semibold leading-snug text-clw-white sm:text-xl">975 Nimco Dr, Unit L</p>
                <p className="text-base leading-relaxed text-clw-gray sm:text-lg">Crystal Lake, IL 60014</p>
              </div>
            </div>

            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-ink transition hover:bg-clw-gold-l sm:min-w-44"
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
