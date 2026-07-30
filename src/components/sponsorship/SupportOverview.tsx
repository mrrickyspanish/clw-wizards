import Link from 'next/link'
import { ArrowUpRight, Building2, Dumbbell, GraduationCap, HandCoins, Trophy } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { SupportImpactChart } from './SupportImpactChart'
import { SupportPageHero } from './SupportPageHero'
import { SupportPathCards } from './SupportPathCards'

const FUNDING_PRIORITIES = [
  {
    title: 'Athlete Access',
    description: 'Registration assistance, scholarships, club gear, and support that helps families keep wrestlers involved.',
    Icon: HandCoins,
  },
  {
    title: 'Competition',
    description: 'Tournament entries, team events, travel assistance, and the costs that create meaningful mat time.',
    Icon: Trophy,
  },
  {
    title: 'Training & Equipment',
    description: 'Practice equipment, safety supplies, uniforms, room essentials, and durable tools athletes use every week.',
    Icon: Dumbbell,
  },
  {
    title: 'Coaching & Development',
    description: 'Coach education, certifications, camps, training resources, and opportunities that raise the level of the room.',
    Icon: GraduationCap,
  },
  {
    title: 'The Wizards Room',
    description: 'Facility operations, improvements, maintenance, and a dependable home where wrestlers can train and belong.',
    Icon: Building2,
  },
]

export function SupportOverview() {
  return (
    <>
      <SupportPageHero
        eyebrow="Ways to support the Wizards"
        title="Get Involved"
        description="Wizards Wrestling Club exists because families, alumni, local businesses, and community partners invest in young wrestlers. Support keeps training accessible, equips the room, creates competition opportunities, and helps every athlete find a place to grow."
        imageSrc="/images/real/team_march2025.jpg"
        imageAlt="Wizards Wrestling Club team photo"
        imagePosition="center"
      />

      <section className="relative overflow-hidden bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-35" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(240,192,32,.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,.04),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,.78fr)_minmax(19rem,.42fr)] lg:items-end">
            <div>
              <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Why support matters</p>
              <h2 className="mt-4 max-w-4xl font-display text-[clamp(3.2rem,9vw,6rem)] uppercase leading-[0.88] text-clw-white">
                Community support keeps the room open to possibility.
              </h2>
            </div>
            <div className="space-y-4 text-lg font-medium leading-relaxed text-clw-gray sm:text-xl lg:text-right">
              <p>The Wizards are volunteer-run and family-powered. Every season requires more than practice plans and tournament schedules.</p>
              <p>It takes equipment, coaching resources, facility support, travel help, and a community willing to make sure opportunity is not limited by a family’s budget.</p>
            </div>
          </div>

          <div className="mt-9 h-[3px] w-full bg-clw-gold sm:mt-12 sm:h-0.5" />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
            {FUNDING_PRIORITIES.map(({ title, description, Icon }, index) => (
              <article
                key={title}
                className={`flex min-h-[190px] flex-col border border-clw-gold/25 p-4 sm:min-h-[245px] sm:p-5 ${
                  index === FUNDING_PRIORITIES.length - 1 ? 'col-span-2 lg:col-span-1' : ''
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clw-gold text-clw-black sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 font-display text-2xl uppercase leading-none tracking-wide text-clw-white sm:text-3xl">{title}</h3>
                <p className="mt-3 hidden text-base font-medium leading-relaxed text-clw-gray sm:block">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light bg-[#F7F4EA] px-5 py-12 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <SupportImpactChart />
      </section>

      <SupportPathCards />

      <section className="section-light bg-[#F7F7F7] px-5 py-10 text-clw-ink sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16 2xl:px-20">
        <div className="mx-auto grid max-w-6xl gap-6 border-y border-clw-ink/15 py-8 text-center lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:text-left">
          <div>
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.28em] text-clw-gold-on-light">Not sure where to start?</p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none text-clw-ink sm:text-5xl">Talk with the Wizards.</h2>
            <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-clw-muted-dark">
              We can help match your interests, business, time, or gift to the club’s current needs.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${ORG.contactEmail}`}
              className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-black px-6 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold transition hover:bg-clw-gold hover:text-clw-black"
            >
              Email the club <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/partners"
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-clw-black px-6 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-black transition hover:border-clw-gold hover:text-clw-gold-on-light"
            >
              View our partners <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
