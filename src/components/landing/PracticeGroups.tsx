import Link from 'next/link'
import { ChevronRight, Shield } from 'lucide-react'

import { ORG } from '@/config/org.config'

const GROUP_BLURBS: Record<string, string> = {
  Black: 'Travel-level wrestlers training for high-level tournaments.',
  Gold: 'Developing competitors building technique and mat time.',
  White: 'New and younger wrestlers learning the fundamentals.',
}

export function PracticeGroups() {
  return (
    <div className="chamfer-md card-depth flex h-full min-h-[410px] flex-col border border-clw-gold/20 bg-clw-black-2 p-7 shadow-2xl shadow-black/20">
      <h2 className="font-display text-5xl uppercase leading-none tracking-wide text-clw-white">Practice groups</h2>
      <p className="mt-4 text-lg leading-relaxed text-clw-gray">A place for every wrestler, whatever their level.</p>

      <div className="mt-7 space-y-3">
        {ORG.practiceGroups.map((group) => (
          <Link
            key={group}
            href="/signup"
            className="group flex items-center gap-4 border border-clw-gold/20 bg-clw-black/55 px-4 py-5 transition-colors hover:border-clw-gold/50 hover:bg-clw-black/80"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-clw-gold/15 text-clw-gold-ink">
              <Shield className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold leading-tight text-clw-white">{group}</span>
              <span className="mt-1 block truncate text-base leading-snug text-clw-gray">
                {GROUP_BLURBS[group] ?? 'A training group within the club.'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
          </Link>
        ))}
      </div>

      <Link href="/signup" className="mt-auto inline-flex items-center gap-2 pt-7 font-display text-xl uppercase tracking-wide text-clw-gold hover:text-clw-gold-l">
        View all groups
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}
