import Link from 'next/link'
import { ArrowUpRight, Building2, Dumbbell, GraduationCap, HandCoins, Trophy } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { getSiteContent } from '@/lib/content/get'
import { SupportImpactChart } from './SupportImpactChart'
import { SupportPageHero } from './SupportPageHero'
import { SupportPathCards } from './SupportPathCards'
import { CTA_BUTTON } from '@/lib/cta'

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

export async function SupportOverview() {
  const content = await getSiteContent()
  const statYears = content.get('home.intro.stat_years')
  const statWrestlers = content.get('home.intro.stat_wrestlers')

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

      <section className="bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-clw-gold/25 bg-clw-black-2 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative h-[250px] overflow-hidden sm:h-[320px] lg:h-auto lg:min-h-[390px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
            <img
              src="/images/real/clw-wizards-youth-team-photo-2.jpg"
              alt="Wizards youth wrestlers together as a team"
              className="absolute inset-0 h-full w-full object-cover object-center grayscale contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-clw-black/55 via-transparent to-clw-black/10" />
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Proof of Community Impact</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,8vw,5rem)] uppercase leading-[0.88] text-clw-white">Support becomes opportunity.</h2>
            <p className="mt-5 text-lg font-medium leading-relaxed text-clw-gray sm:text-xl">
              Community investment turns into coaching, mat time, competition experience, team connection, and a room where young wrestlers learn to keep showing up.
            </p>

            <div className="mt-7 grid grid-cols-3 border-y border-clw-gold/25 py-5 text-center">
              <div className="border-r border-clw-white/10 px-2">
                <p className="font-display text-3xl leading-none text-clw-gold sm:text-4xl">{statYears}</p>
                <p className="mt-2 font-cond text-sm uppercase tracking-[0.16em] text-clw-gray">Years</p>
              </div>
              <div className="border-r border-clw-white/10 px-2">
                <p className="font-display text-3xl leading-none text-clw-gold sm:text-4xl">IKWF</p>
                <p className="mt-2 font-cond text-sm uppercase tracking-[0.16em] text-clw-gray">Registered</p>
              </div>
              <div className="px-2">
                <p className="font-display text-3xl leading-none text-clw-gold sm:text-4xl">{statWrestlers}</p>
                <p className="mt-2 font-cond text-sm uppercase tracking-[0.16em] text-clw-gray">Wrestlers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SupportPathCards />

      <section id="contact" className="section-light scroll-mt-32 bg-[#F7F7F7] px-5 py-10 text-clw-ink sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16 2xl:px-20">
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
              className={`${CTA_BUTTON} bg-clw-black text-clw-gold hover:bg-clw-gold hover:text-clw-black`}
            >
              Email the club <ArrowUpRight className="h-4 w-4" />
            </a>
            <Link
              href="/partners"
              className={`${CTA_BUTTON} border-2 border-clw-black text-clw-black hover:border-clw-gold hover:text-clw-gold-on-light`}
            >
              View our partners <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
