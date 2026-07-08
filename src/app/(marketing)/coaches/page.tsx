import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'

const BOARD = [
  { name: 'Tony Fontanetta', role: 'President, Head Coach & Club Coordinator' },
  { name: 'Sabrina Jimenez', role: 'Secretary-Treasurer, Singlets, Pictures & Payments' },
  { name: 'Steve Swierk', role: 'Vice President of Operations & Tournaments' },
  { name: 'Jeramy Carbone', role: 'Vice President, Tournaments, Stats & Facilities' },
  { name: 'Tyler Simmons', role: 'Board Member' },
  { name: 'Julie Swierk', role: 'Board Assistant & Hotel Blocks' },
]

const PRACTICE_COACHES = [
  { group: 'Group 1', coaches: 'Alex Flores, Ryan Schweikhofer' },
  { group: 'Group 2', coaches: 'Tyler Simmons, Matt Fiodirosa' },
  { group: 'Group 3', coaches: 'Jeramy Carbone, Anthony Fontanetta' },
  { group: 'Group 4', coaches: 'Anthony Fontanetta, Steve Swierk' },
]

export const metadata: Metadata = {
  title: 'Coaches & Staff',
  description: 'Meet the volunteer coaches, board members, and team leaders behind Wizards Wrestling Club.',
}

export default function CoachesPage() {
  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_82%_3%,rgba(240,192,32,.14),transparent_25%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_34%)]" />

      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <header>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-clw-gold" />
              <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Leadership & Coaching</p>
            </div>
            <h1 className="mt-5 font-display text-5xl uppercase leading-[0.92] text-clw-white sm:text-6xl lg:text-7xl">
              People who keep the room moving.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:text-xl">
              Meet the volunteers who lead the club, organize the season, and coach our wrestlers through every stage of development.
            </p>
          </header>

          <div className="overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club team photography */}
            <img
              src="/images/real/clw-wizards-coach-team-photo.jpg"
              alt="Wizards Wrestling coaches and wrestlers together"
              className="h-72 w-full object-cover object-center contrast-105 saturate-[0.82] sm:h-96 lg:h-[28rem]"
            />
          </div>
        </div>

        <section className="mt-10">
          <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Board & Main Contacts</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">The people behind the program.</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {BOARD.map((person) => (
                <article key={person.name} className="border border-clw-gold/15 bg-clw-black/45 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-clw-gold/30 bg-clw-gold/10 font-display text-lg text-clw-gold">
                    {person.name.split(' ').map((part) => part[0]).join('')}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold leading-tight text-clw-white">{person.name}</h3>
                  <p className="mt-2 text-base leading-relaxed text-clw-gray">{person.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Practice Room Coaches</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">Coaching at every stage.</h2>
            <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
              {PRACTICE_COACHES.map((group) => (
                <div key={group.group} className="border-t border-clw-gold/15 py-5">
                  <p className="font-display text-2xl uppercase text-clw-white">{group.group}</p>
                  <p className="mt-2 text-base leading-relaxed text-clw-gray">{group.coaches}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="chamfer-md border border-clw-gold/20 bg-clw-gold p-7 text-clw-black sm:p-8 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.26em]">New to the Club?</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] sm:text-5xl">Start with the new-family guide.</h2>
            <p className="mt-5 text-lg leading-relaxed text-clw-black/75">
              Learn what to expect, how group placement works, and the best next step before creating an account.
            </p>
            <Link href="/join" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 border border-clw-black/30 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black hover:border-clw-black">
              New Families <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
