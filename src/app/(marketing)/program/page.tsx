import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Trophy } from 'lucide-react'

import { ORG } from '@/config/org.config'

const GROUP_BLURBS: Record<string, string> = {
  Black: 'Travel-level wrestlers preparing for higher-level competition and tougher tournament weekends.',
  Gold: 'Developing competitors building technique, mat confidence, and consistent practice habits.',
  White: 'Newer and younger wrestlers learning fundamentals, movement, discipline, and how to compete safely.',
}

const GROUP_LABELS: Record<string, string> = {
  Black: 'Advanced Competition',
  Gold: 'Developing Competitors',
  White: 'Learning the Fundamentals',
}

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
              Practice groups built for growth.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:text-xl">
              Wrestlers train in a structured environment that matches their current stage, challenges them appropriately, and gives them a clear path forward.
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

        <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {ORG.practiceGroups.map((group) => (
            <article key={group} className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8">
              <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Practice Group</p>
              <h2 className="mt-5 font-display text-5xl uppercase leading-none text-clw-white">{group}</h2>
              <p className="mt-4 font-semibold text-clw-white">{GROUP_LABELS[group] ?? 'Focused Development'}</p>
              <p className="mt-3 text-lg leading-relaxed text-clw-gray">
                {GROUP_BLURBS[group] ?? 'A focused training group within the club program.'}
              </p>
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
