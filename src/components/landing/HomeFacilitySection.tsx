import { MapPin } from 'lucide-react'

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'

export function HomeFacilitySection() {
  return (
    <section className="section-light relative isolate overflow-hidden border-y border-clw-gold/25 bg-[#F7F7F7] px-5 py-14 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(180deg,rgba(255,255,255,.86),transparent_48%),radial-gradient(circle_at_14%_10%,rgba(240,192,32,.12),transparent_26%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 select-none font-display text-[12rem] leading-none text-clw-gold-dim/[0.06] sm:text-[16rem] lg:text-[22rem]"
      >
        W
      </span>

      <div id="location" className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-ink">Location</p>
          <h2 className="mt-6 whitespace-nowrap uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.2rem,9.5vw,5rem)] font-light tracking-[-0.04em] sm:mr-3">
              Visit the
            </span>
            <span className="inline font-display text-[clamp(2.45rem,10.5vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold-ink">
              Facility
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-muted-dark sm:text-2xl sm:leading-relaxed">
            Centrally located in Crystal Lake, our training space is built to be the easy choice for McHenry County wrestlers.
            Convenient access means more time on the mat and less time in the car.
          </p>
        </div>

        <div className="border border-clw-ink/20 bg-clw-white shadow-2xl shadow-black/10">
          <div className="h-56 overflow-hidden sm:h-72 lg:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club facility photo */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards Wrestling Club facility"
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div className="grid gap-6 border-t border-clw-ink/15 bg-clw-white p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-clw-gold-ink" />
                <p className="font-display text-3xl uppercase leading-none tracking-wide text-clw-ink">Crystal Lake Wizards Wrestling Club</p>
              </div>
              <p className="mt-4 text-xl leading-relaxed text-clw-muted-dark">975 Nimco Dr, Unit L</p>
              <p className="text-xl leading-relaxed text-clw-muted-dark">Crystal Lake, IL 60014</p>
            </div>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-sm inline-flex justify-center bg-clw-gold px-6 py-4 font-cond text-lg uppercase tracking-[0.18em] text-clw-black transition hover:bg-clw-gold-l"
            >
              Visit facility →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
