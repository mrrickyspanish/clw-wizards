import Link from 'next/link'
import type { Metadata } from 'next'
import { Award, HeartHandshake, MapPin, ShieldCheck, Users } from 'lucide-react'

const STAND_FOR = [
  'Safety is our most important priority.',
  'Members of the team are students first and athletes second.',
  'Club wrestling better prepares a wrestler for high school competition than other youth wrestling options.',
  'Sportsmanship is expected of every Wizard wrestler and coach.',
  'A wrestler who does not follow team rules may be disciplined, especially if they are a risk to themselves or their teammates.',
]

const WHY_WRESTLING = [
  { title: 'Discipline', body: 'The desire to make the sacrifices necessary to become a better athlete and person.' },
  { title: 'Agility', body: 'The ability to change position efficiently and stay a step ahead on the mat.' },
  { title: 'Endurance', body: 'Muscular and cardiovascular stamina built rep by rep, period by period.' },
  { title: 'A Winning Attitude', body: 'The inner knowledge that you will do your best, win or lose.' },
]

const BOARD = [
  { name: 'Tony Fontanetta', role: 'President, Head Coach & Club Coordinator', phone: '312-656-7335' },
  { name: 'Sabrina Jimenez', role: 'Secretary-Treasurer, Singlets, Pictures & Payments', phone: '815-482-4464' },
  { name: 'Steve Swierk', role: 'Vice President of Operations & Tournaments', phone: '630-886-1769' },
  { name: 'Jeramy Carbone', role: 'Vice President, Tournaments, Stats & Facilities', phone: '847-812-4010' },
  { name: 'Tyler Simmons', role: 'Board Member', phone: '815-245-7320' },
  { name: 'Julie Swierk', role: 'Board Assistant & Hotel Blocks', phone: null },
]

const PRACTICE_COACHES = [
  { group: 'Group 1', coaches: 'Alex Flores, Ryan Schweikhofer' },
  { group: 'Group 2', coaches: 'Tyler Simmons, Matt Fiodirosa' },
  { group: 'Group 3', coaches: 'Jeramy Carbone, Anthony Fontanetta' },
  { group: 'Group 4', coaches: 'Anthony Fontanetta, Steve Swierk' },
]

export const metadata: Metadata = {
  title: 'About',
  description: 'The Crystal Lake Wizards Wrestling Club: our story, our values, our coaches, and our facility.',
}

export default function AboutPage() {
  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">About the Wizards</h1>
        <p className="mt-4 text-clw-gray">
          A Crystal Lake Park District affiliated program, registered through the Illinois Kids Wrestling Federation
          (IKWF).
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-8">
          <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Our story</h2>
          <p className="mt-4 text-base leading-relaxed text-clw-gray">
            Now in our fifth decade, the Wizards are one of the premier youth wrestling organizations in the
            country. We are committed to providing a safe and supportive environment for kids ages 5 to 14 from
            Crystal Lake and the surrounding community. Each year 120 to 155 wrestlers train with us, from beginning
            fundamentals to the advanced technique needed to compete at the highest levels.
          </p>
          <p className="mt-3 text-base leading-relaxed text-clw-gray">
            Our goal is to introduce wrestling in a competitive but fun environment and to help every wrestler reach
            their potential through serious commitment. Nearly every year we produce state qualifiers and state
            placers, and many of our wrestlers go on to wrestle in high school and college, taking the discipline,
            teamwork, and respect they built here with them.
          </p>
          <p className="mt-3 text-base leading-relaxed text-clw-gray">
            CLW Wrestling is a 501(c)(3) nonprofit youth sports organization run 100% by volunteers.
          </p>
        </div>

        <div className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-clw-gold-ink" />
            <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">What we stand for</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {STAND_FOR.map((point) => (
              <li key={point} className="text-base leading-relaxed text-clw-gray">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-5">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-clw-gold-ink" />
            <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Why wrestling</h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_WRESTLING.map(({ title, body }) => (
              <div key={title} className="rounded-md border border-clw-gold/10 bg-clw-black/40 p-4">
                <p className="font-display text-lg uppercase tracking-wide text-clw-white">{title}</p>
                <p className="mt-2 text-base leading-relaxed text-clw-gray">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-8">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-clw-gold-ink" />
            <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Leadership & coaches</h2>
          </div>

          <h3 className="mt-5 font-cond text-sm uppercase tracking-[0.2em] text-clw-gray">Board</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BOARD.map((person) => (
              <div key={person.name} className="rounded-md border border-clw-gold/10 bg-clw-black/40 px-3 py-3">
                <p className="text-base font-medium text-clw-white">{person.name}</p>
                <p className="text-sm text-clw-gray">{person.role}</p>
                {person.phone && <p className="mt-1 text-sm text-clw-gold-ink">{person.phone}</p>}
              </div>
            ))}
          </div>

          <h3 className="mt-6 font-cond text-sm uppercase tracking-[0.2em] text-clw-gray">Practice room coaches</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRACTICE_COACHES.map((p) => (
              <div key={p.group} className="rounded-md border border-clw-gold/10 bg-clw-black/40 px-3 py-3">
                <p className="text-base font-medium text-clw-white">{p.group}</p>
                <p className="text-sm text-clw-gray">{p.coaches}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-clw-gold-ink" />
            <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Visit us</h2>
          </div>
          <p className="mt-4 text-base text-clw-white">975 Nimco Dr, Unit L</p>
          <p className="text-base text-clw-white">Crystal Lake, IL 60014</p>
          <p className="mt-3 text-base leading-relaxed text-clw-gray">
            Parking is limited along the building, with additional spots to the west. Please do not park in front of
            the garage door.
          </p>
          <p className="mt-3 text-base leading-relaxed text-clw-gray">
            Stop by and see the Wizards Wall of Fame: Senior, Novice, Midget & Bantam state champions.
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm font-medium uppercase tracking-wide text-clw-gold-ink hover:text-clw-gold"
          >
            Get directions →
          </a>

          <div className="mt-auto pt-6">
            <div className="flex items-center gap-2 border-t border-clw-gold/10 pt-4">
              <HeartHandshake className="h-4 w-4 shrink-0 text-clw-gold-ink" />
              <p className="text-base leading-relaxed text-clw-gray">
                We&apos;re run 100% by volunteers. Local business sponsorships help underwrite the cost of the program for
                every family.{' '}
                <Link href="/sponsorship" className="text-clw-gold-ink hover:text-clw-gold">
                  See sponsorship opportunities →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
