import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Trophy } from 'lucide-react'

// Public-facing group copy — presents the club's four practice groups as a
// progression. (Backend group identifiers live in ORG.practiceGroups and are
// reconciled separately; these are display copy only.)
const PROGRAM_GROUPS = [
  {
    number: '1',
    label: 'Learning the Fundamentals',
    level: 'New to the sport',
    body: 'Our youngest, brand-new wrestlers (6 & under). Learn the sport, build safe habits, and find out how much they love it.',
  },
  {
    number: '2',
    label: 'Building the Basics',
    level: 'Developing',
    body: 'Ages roughly 6–10, still learning and developing. Steady growth over competition as wrestlers sharpen technique and confidence.',
  },
  {
    number: '3',
    label: 'Competing Regularly',
    level: 'Competitive',
    body: 'Older wrestlers — some newer to the sport — training at a more advanced pace and competing often throughout the season.',
  },
  {
    number: '4',
    label: 'Most Competitive',
    level: 'Elite / state-level',
    body: 'Our advanced, travel-level group, training with real aspirations: state finals, tougher tournament weekends, and beyond.',
  },
]

const SEASON_POINTS = [
  'Structured practice groups help athletes train with wrestlers at a similar stage.',
  'Focused coaching keeps practices clear, disciplined, and development-driven.',
  'Tournament weekends give wrestlers real competition experience and a clear next step.',
]

export const metadata: Metadata = {
  title: 'Training Groups',
  description: 'Practice groups, coaching structure, and season overview for Wizards Wrestling Club.',
}

export default function ProgramPage() {
  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_82%_2%,rgba(240,192,32,.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_34%)]" />

      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <header>
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Wizards Program</p>
            <h1 className="mt-5 font-display text-5xl uppercase leading-[0.92] text-clw-white sm:text-6xl lg:text-7xl">
              Four groups. One clear roadmap.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:text-xl">
              Wrestlers start where they fit today and grow toward the most competitive room. Being one of the area&apos;s bigger clubs is the advantage: we group by ability, experience, age, and size, so a first-year wrestler learns with peers instead of being stuck across the mat from an eighth-grader.
            </p>
          </header>

          <div className="overflow-hidden border border-clw-gold/20 bg-clw-black-2 shadow-2xl shadow-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club practice photography */}
            <img
              src="/images/real/team_march2025.jpg"
              alt="Wizards wrestlers training and competing together"
              className="h-72 w-full object-cover object-center contrast-105 saturate-[0.82] sm:h-96 lg:h-[28rem]"
            />
          </div>
        </div>

        <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAM_GROUPS.map((group) => (
            <article key={group.number} className="chamfer-md card-depth flex flex-col border border-clw-gold/15 bg-clw-black-2 p-6 sm:p-7">
              <div className="flex items-baseline gap-2">
                <span className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Group</span>
                <span className="font-display text-5xl leading-none text-clw-gold">{group.number}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl uppercase leading-tight text-clw-white">{group.label}</h2>
              <div className="mt-3.5">
                <span aria-hidden className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1.5 w-6 ${i <= Number(group.number) ? 'bg-clw-gold' : 'bg-clw-white/15'}`} />
                  ))}
                </span>
                <p className="mt-2 font-cond text-sm uppercase tracking-[0.16em] text-clw-gray">
                  Competition: {group.level}
                </p>
              </div>
              <p className="mt-3.5 text-base leading-relaxed text-clw-gray">{group.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:col-span-8 lg:p-10">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-clw-gold" />
              <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">How the Season Works</p>
            </div>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">Train with purpose. Compete when ready.</h2>
            <div className="mt-7 space-y-5">
              {SEASON_POINTS.map((point) => (
                <p key={point} className="flex gap-3 text-lg leading-relaxed text-clw-gray">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                  <span>{point}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="chamfer-md flex flex-col border border-clw-gold/20 bg-clw-gold p-7 text-clw-black sm:p-8 lg:col-span-4 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.26em]">New Families</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] sm:text-5xl">Not sure where your wrestler fits?</h2>
            <p className="mt-5 text-lg leading-relaxed text-clw-black/75">
              Coaches help determine the best training environment based on experience, maturity, technique, and practice readiness.
            </p>
            <Link
              href="/join"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 border border-clw-black/30 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black hover:border-clw-black"
            >
              Start Here <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
