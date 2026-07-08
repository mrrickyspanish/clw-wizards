import Link from 'next/link'
import type { Metadata } from 'next'

import { ORG } from '@/config/org.config'

const GROUP_BLURBS: Record<string, string> = {
  Black: 'Travel-level wrestlers preparing for higher-level competition and tougher tournament weekends.',
  Gold: 'Developing competitors building technique, mat confidence, and consistent practice habits.',
  White: 'Newer and younger wrestlers learning fundamentals, movement, discipline, and how to compete safely.',
}

const SEASON_POINTS = [
  'Structured practice groups help athletes train with wrestlers at a similar stage.',
  'Focused coaching keeps practices clear, disciplined, and development-driven.',
  'Tournament weekends give wrestlers real competition experience and a clear next step.',
]

export const metadata: Metadata = {
  title: 'Program',
  description: 'Practice groups, coaching structure, and season overview for Crystal Lake Wizards Wrestling Club.',
}

export default function ProgramPage() {
  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="max-w-3xl">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Wizards Program</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">
          Practice groups built for growth
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-clw-gray sm:text-xl">
          The Wizards program gives wrestlers a structured place to develop skills, confidence, discipline, and match readiness throughout the season.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {ORG.practiceGroups.map((group) => (
          <div key={group} className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6">
            <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Practice group</p>
            <h2 className="mt-3 font-display text-4xl uppercase tracking-wide text-clw-white">{group}</h2>
            <p className="mt-4 text-base leading-relaxed text-clw-gray">
              {GROUP_BLURBS[group] ?? 'A focused training group within the club program.'}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-8">
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">How the season works</h2>
          <div className="mt-5 space-y-4">
            {SEASON_POINTS.map((point) => (
              <p key={point} className="text-base leading-relaxed text-clw-gray">
                {point}
              </p>
            ))}
          </div>
        </div>

        <div className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-6 lg:col-span-4">
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Ready to join?</h2>
          <p className="mt-4 text-base leading-relaxed text-clw-gray">
            Start with the new-family guide to understand the room, training groups, expected costs, and the best next step for your wrestler.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-block bg-clw-gold px-6 py-4 text-center font-display text-xl uppercase tracking-wide text-clw-black transition hover:bg-clw-gold-l"
          >
            Start Here
          </Link>
        </div>
      </section>
    </main>
  )
}
