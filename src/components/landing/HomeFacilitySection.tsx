import { MapPin } from 'lucide-react'

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'

export function HomeFacilitySection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_14%_10%,rgba(240,192,32,.16),transparent_26%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 select-none font-display text-[12rem] leading-none text-clw-gold/[0.045] sm:text-[16rem] lg:text-[22rem]"
      >
        W
      </span>

      <div id="location" className="relative mx-auto grid max-w-7xl scroll-mt-24 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Location</p>
          <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white">
            <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
              Visit the
            </span>
            <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em]">
              Facility
            </span>
          </h2>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed">
            Centrally located in Crystal Lake, our training space is built to be the easy choice for McHenry County wrestlers.
            Convenient access means more time on the mat and less time in the car.
          </p>
        </div>

        <div className="border border-clw-gold/25 bg-clw-black-2 shadow-2xl shadow-black/30">
          <div className="h-56 overflow-hidden sm:h-72 lg:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club facility photo */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Crystal Lake Wizards Wrestling Club facility"
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div className="grid gap-6 border-t border-clw-gold/25 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-clw-gold" />
                <p className="font-display text-3xl uppercase leading-none tracking-wide text-clw-white">Crystal Lake Wizards Wrestling Club</p>
              </div>
              <p className="mt-4 text-xl leading-relaxed text-clw-gray">975 Nimco Dr, Unit L</p>
              <p className="text-xl leading-relaxed text-clw-gray">Crystal Lake, IL 60014</p>
            </div>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center bg-clw-gold px-6 py-4 font-cond text-lg uppercase tracking-[0.18em] text-clw-black transition hover:bg-clw-gold-l"
            >
              Visit facility →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
