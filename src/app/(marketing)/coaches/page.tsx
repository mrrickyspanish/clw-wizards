import type { Metadata } from 'next'
import Link from 'next/link'

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
  description: 'Crystal Lake Wizards Wrestling Club coaches, board members, and team contacts.',
}

export default function CoachesPage() {
  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="max-w-3xl">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Wizards Wrestling Club</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">Coaches & Staff</h1>
        <p className="mt-4 text-clw-gray">
          Meet the volunteers who lead the club, organize the season, and coach our wrestlers in the practice room.
        </p>
      </header>

      <section className="mt-10">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6">
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Board & main contacts</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {BOARD.map((person) => (
              <div key={person.name} className="border border-clw-gold/10 bg-clw-black/45 p-4">
                <p className="text-lg font-semibold text-clw-white">{person.name}</p>
                <p className="mt-1 text-base leading-relaxed text-clw-gray">{person.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6">
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Practice room coaches</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {PRACTICE_COACHES.map((group) => (
              <div key={group.group} className="border border-clw-gold/10 bg-clw-black/45 p-4">
                <p className="text-lg font-semibold text-clw-white">{group.group}</p>
                <p className="mt-1 text-base leading-relaxed text-clw-gray">{group.coaches}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Link href="/" className="mt-8 inline-block font-cond text-xl uppercase tracking-[0.18em] text-clw-gold underline-offset-4 hover:text-clw-gold-l hover:underline">
        Back to homepage →
      </Link>
    </main>
  )
}
