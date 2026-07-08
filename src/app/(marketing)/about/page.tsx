import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Award, Check, HeartHandshake, MapPin, ShieldCheck, Users } from 'lucide-react'

const STAND_FOR = [
  'Safety is our most important priority.',
  'Members of the team are students first and athletes second.',
  'Sportsmanship is expected of every Wizard wrestler and coach.',
  'Every wrestler should be challenged, supported, and held accountable.',
]

const WHY_WRESTLING = [
  { number: '01', title: 'Discipline', body: 'The willingness to make the sacrifices required to improve as an athlete and a person.' },
  { number: '02', title: 'Agility', body: 'The ability to change position efficiently, react quickly, and stay a step ahead on the mat.' },
  { number: '03', title: 'Endurance', body: 'Physical and mental stamina built rep by rep, practice by practice, and period by period.' },
  { number: '04', title: 'A Winning Attitude', body: 'The confidence to compete hard, respond to adversity, and give your best regardless of the result.' },
]

const FEATURED_LEADERS = [
  { name: 'Tony Fontanetta', role: 'President, Head Coach & Club Coordinator', phone: '312-656-7335', initials: 'TF' },
  { name: 'Sabrina Jimenez', role: 'Secretary-Treasurer, Singlets, Pictures & Payments', phone: '815-482-4464', initials: 'SJ' },
  { name: 'Steve Swierk', role: 'Vice President of Operations & Tournaments', phone: '630-886-1769', initials: 'SS' },
]

const PRACTICE_COACHES = [
  { group: 'Group 1', coaches: 'Alex Flores, Ryan Schweikhofer' },
  { group: 'Group 2', coaches: 'Tyler Simmons, Matt Fiodirosa' },
  { group: 'Group 3', coaches: 'Jeramy Carbone, Anthony Fontanetta' },
  { group: 'Group 4', coaches: 'Anthony Fontanetta, Steve Swierk' },
]

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'
const SECTION_HEADING_CLASS = 'mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl'

export const metadata: Metadata = {
  title: 'Mission',
  description: 'The mission, values, leadership, and community behind Wizards Wrestling Club in McHenry County.',
}

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_85%_4%,rgba(240,192,32,.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.035),transparent_32%)]" />

      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.34em] text-clw-gold">Wizards Wrestling Club</p>
            <h1 className="mt-5 max-w-4xl uppercase leading-[0.9] text-clw-white">
              <span className="block font-cond text-[clamp(3.2rem,8vw,6rem)] font-light tracking-[-0.045em]">Built for</span>
              <span className="block font-display text-[clamp(3.65rem,8.8vw,6.8rem)] font-black tracking-[-0.04em] text-clw-gold">
                McHenry County Wrestlers
              </span>
            </h1>
            <p className="mt-7 max-w-3xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:text-[1.35rem]">
              Wizards Wrestling Club gives young athletes a serious place to learn, compete, and grow. We combine high expectations with a supportive room where kids build confidence, discipline, and a lasting respect for the sport.
            </p>
          </div>

          <div className="overflow-hidden border border-clw-gold/25 bg-clw-black-2 shadow-2xl shadow-black/40">
            <div className="h-72 overflow-hidden sm:h-96 lg:h-[30rem]">
              {/* eslint-disable-next-line @next/next/no-img-element -- real club photography */}
              <img
                src="/images/real/clw-wizards-coach-team-photo.jpg"
                alt="Wizards Wrestling coaches and wrestlers together"
                className="h-full w-full object-cover object-center contrast-105 saturate-[0.82]"
              />
            </div>
            <div className="grid grid-cols-3 border-t border-clw-gold/25 bg-clw-black">
              <div className="border-r border-clw-gold/20 px-3 py-5 text-center sm:px-5">
                <p className="font-display text-3xl uppercase leading-none text-clw-gold sm:text-4xl">40+</p>
                <p className="mt-2 font-cond text-xs uppercase tracking-[0.18em] text-clw-gray">Years</p>
              </div>
              <div className="border-r border-clw-gold/20 px-3 py-5 text-center sm:px-5">
                <p className="font-display text-3xl uppercase leading-none text-clw-gold sm:text-4xl">5–14</p>
                <p className="mt-2 font-cond text-xs uppercase tracking-[0.18em] text-clw-gray">Ages</p>
              </div>
              <div className="px-3 py-5 text-center sm:px-5">
                <p className="font-display text-3xl uppercase leading-none text-clw-gold sm:text-4xl">IKWF</p>
                <p className="mt-2 font-cond text-xs uppercase tracking-[0.18em] text-clw-gray">Registered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mission-frame relative grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <article className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:col-span-8 lg:p-10">
          <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Our Story</p>
          <h2 className={SECTION_HEADING_CLASS}>
            <span className="block">A Room Built to Move</span>
            <span className="block">Wrestlers Forward.</span>
          </h2>
          <div className="mt-6 h-px w-full bg-clw-gold/35" />
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-clw-gray sm:text-xl sm:leading-relaxed">
            <p>
              Now in our fifth decade, Wizards Wrestling is one of the area&apos;s established youth wrestling programs. Each season, wrestlers from across McHenry County train with us, from kids learning their first stance to experienced competitors preparing for the highest levels of youth wrestling.
            </p>
            <p>
              Our goal is simple: introduce wrestling in a competitive but positive environment and help every athlete reach their potential through serious commitment. State qualifiers, state placers, high school wrestlers, and college athletes have all come through the room, but progress is measured one wrestler at a time.
            </p>
          </div>
        </article>

        <aside className="chamfer-md card-depth border border-clw-gold/20 bg-clw-black-2 p-7 sm:p-8 lg:col-span-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">What We Stand For</p>
          </div>
          <h2 className={SECTION_HEADING_CLASS}>
            <span className="block whitespace-nowrap">The Standard</span>
            <span className="block whitespace-nowrap">Inside the Room.</span>
          </h2>
          <ul className="mt-7 space-y-5">
            {STAND_FOR.map((point) => (
              <li key={point} className="flex gap-3 text-lg leading-relaxed text-clw-gray">
                <Check className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mission-frame relative mt-5 lg:mt-6">
        <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Why Wrestling</p>
          </div>

          <h2 className={SECTION_HEADING_CLASS}>
            <span className="block">What the Sport Builds</span>
            <span className="block">Beyond the Mat.</span>
          </h2>

          <div className="mt-7 grid gap-4 border-y border-clw-gold/20 bg-clw-black/35 px-5 py-6 sm:px-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
            <p className="whitespace-nowrap font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Why It Matters</p>
            <p className="max-w-4xl text-xl leading-relaxed text-clw-white sm:text-2xl">
              Wrestling asks young athletes to solve problems under pressure, take responsibility for preparation, and keep working when progress is difficult.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_WRESTLING.map(({ number, title, body }) => (
              <article key={title} className="border border-clw-gold/15 bg-clw-black/45 p-6">
                <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">{number}</p>
                <h3 className="mt-5 font-display text-3xl uppercase leading-none text-clw-white">{title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-clw-gray">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mission-frame relative mt-5 grid grid-cols-1 gap-5 lg:mt-6 lg:grid-cols-12 lg:gap-6">
        <article className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:col-span-8 lg:p-10">
          <div className="flex flex-col gap-5 border-b border-clw-gold/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-clw-gold" />
                <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Leadership & Coaches</p>
              </div>
              <h2 className={SECTION_HEADING_CLASS}>
                <span className="block">People Who Keep</span>
                <span className="block">The Room Moving.</span>
              </h2>
            </div>
            <Link
              href="/coaches"
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-clw-gold/35 px-4 py-3 font-cond text-base uppercase tracking-[0.18em] text-clw-gold transition hover:border-clw-gold hover:text-clw-gold-l"
            >
              Full Staff <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {FEATURED_LEADERS.map((person) => (
              <div key={person.name} className="border border-clw-gold/15 bg-clw-black/45 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-clw-gold/35 bg-clw-gold/10 font-display text-xl text-clw-gold">
                  {person.initials}
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-tight text-clw-white">{person.name}</h3>
                <p className="mt-2 text-base leading-relaxed text-clw-gray">{person.role}</p>
                <a href={`tel:${person.phone.replaceAll('-', '')}`} className="mt-4 inline-block font-cond text-sm uppercase tracking-[0.16em] text-clw-gold">
                  {person.phone}
                </a>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Practice Room Coaches</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PRACTICE_COACHES.map((group) => (
                <div key={group.group} className="grid grid-cols-[auto_1fr] gap-4 border-t border-clw-gold/15 py-4">
                  <span className="font-display text-2xl uppercase text-clw-white">{group.group}</span>
                  <span className="text-base leading-relaxed text-clw-gray">{group.coaches}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="chamfer-md card-depth flex flex-col border border-clw-gold/20 bg-clw-black-2 p-7 sm:p-8 lg:col-span-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Club Details</p>
          </div>
          <h2 className={SECTION_HEADING_CLASS}>
            <span className="block whitespace-nowrap">Rooted Here.</span>
            <span className="block whitespace-nowrap">Open to the Area.</span>
          </h2>

          <div className="mt-7 overflow-hidden border border-clw-gold/15">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club facility photo */}
            <img
              src="/images/real/facility_pano.jpg"
              alt="Wizards Wrestling training facility"
              className="h-44 w-full object-cover contrast-105 saturate-[0.72]"
            />
          </div>

          <div className="mt-6 space-y-5 text-lg leading-relaxed text-clw-gray">
            <p>
              <span className="block font-cond text-sm uppercase tracking-[0.2em] text-clw-gold">Facility</span>
              <span className="mt-1 block text-clw-white">975 Nimco Dr, Unit L<br />Crystal Lake, IL 60014</span>
            </p>
            <p>
              <span className="block font-cond text-sm uppercase tracking-[0.2em] text-clw-gold">Affiliation</span>
              <span className="mt-1 block">Crystal Lake Park District affiliated and registered through the IKWF.</span>
            </p>
            <p>
              <span className="block font-cond text-sm uppercase tracking-[0.2em] text-clw-gold">Organization</span>
              <span className="mt-1 block">501(c)(3) nonprofit, powered 100% by volunteers.</span>
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-sm flex min-h-12 items-center justify-center bg-clw-gold px-5 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
            >
              Get Directions
            </a>
            <Link
              href="/sponsorship"
              className="flex min-h-12 items-center justify-center gap-2 border border-clw-gold/35 px-5 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold transition hover:border-clw-gold hover:text-clw-gold-l"
            >
              <HeartHandshake className="h-4 w-4" />
              Support the Club
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
