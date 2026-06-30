import Link from 'next/link'
import { Phone } from 'lucide-react'

const FEATURED_STAFF = [
  { name: 'Tony Fontanetta', role: 'President, Head Coach & Club Coordinator', phone: '312-656-7335', initials: 'TF' },
  { name: 'Sabrina Jimenez', role: 'Secretary-Treasurer, Singlets, Pictures & Payments', phone: '815-482-4464', initials: 'SJ' },
  { name: 'Steve Swierk', role: 'Vice President of Operations & Tournaments', phone: '630-886-1769', initials: 'SS' },
]

export function HomeTeamSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black px-5 py-14 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-50" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_82%_4%,rgba(240,192,32,.16),transparent_24%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_42%)]" />

      <div id="team" className="relative mx-auto max-w-7xl scroll-mt-24">
        <div className="flex flex-col gap-6 lg:items-center lg:text-center">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Team</p>
            <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-white lg:mx-auto lg:max-w-none">
              <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em] lg:mr-3 lg:inline">
                Meet our
              </span>
              <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold lg:inline">
                Team
              </span>
            </h2>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURED_STAFF.map((person) => (
            <div key={person.name} className="flex h-full flex-col border border-clw-gold/25 bg-clw-black-2 shadow-2xl shadow-black/25 lg:h-[460px]">
              <div className="flex h-48 items-center justify-center bg-clw-black/65 lg:h-auto lg:flex-[6]">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-clw-gold/35 bg-clw-gold/10 font-display text-5xl uppercase leading-none text-clw-gold">
                  {person.initials}
                </div>
              </div>
              <div className="flex flex-1 flex-col border-t border-clw-gold/25 bg-clw-white p-6 text-clw-ink lg:flex-1 lg:p-5">
                <h3 className="font-body text-2xl font-semibold leading-tight lg:text-xl">{person.name}</h3>
                <p className="mt-2 text-lg leading-relaxed text-clw-muted-dark lg:mt-1.5 lg:text-sm lg:leading-snug">{person.role}</p>
                <a href={`tel:${person.phone.replaceAll('-', '')}`} className="mt-4 flex items-center gap-2 font-cond text-base uppercase tracking-[0.18em] text-clw-gold-ink hover:text-clw-ink lg:mt-3 lg:text-sm">
                  <Phone className="h-4 w-4" />
                  {person.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-start lg:justify-center">
          <Link href="/coaches" className="font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline">
            See full staff →
          </Link>
        </div>
      </div>
    </section>
  )
}
