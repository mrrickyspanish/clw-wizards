import { MapPin } from 'lucide-react'

export function LocationCard() {
  return (
    <div className="chamfer-md card-depth flex flex-col gap-5 border border-clw-gold/20 bg-clw-black-2 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-center gap-4">
        <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md border border-clw-gold/10 sm:h-24 sm:w-40">
          {/* eslint-disable-next-line @next/next/no-img-element -- real facility photo */}
          <img
            src="/images/real/facility_pano.jpg"
            alt="The Wizards practice room and mats"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-clw-gold-ink" />
            <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Where we practice</h2>
          </div>
          <p className="mt-1 text-base text-clw-gray">975 Nimco Dr, Unit L, Crystal Lake, IL 60014</p>
        </div>
      </div>
      <a
        href="https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-sm font-semibold uppercase tracking-[0.16em] text-clw-gold-ink hover:text-clw-gold"
      >
        Get directions →
      </a>
    </div>
  )
}
