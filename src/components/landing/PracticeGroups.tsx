import Link from 'next/link'
import { ChevronRight, Shield } from 'lucide-react'

import { ORG } from '@/config/org.config'

// Short blurbs per group; falls back to a generic line for any group without
// one so adding a group in config never leaves an empty card.
const GROUP_BLURBS: Record<string, string> = {
  Black: 'Travel-level wrestlers training for high-level tournaments.',
  Gold: 'Developing competitors building technique and mat time.',
  White: 'New and younger wrestlers learning the fundamentals.',
  'Wizard for Life': 'Alumni and lifelong members of the Wizards community.',
}

export function PracticeGroups() {
  return (
    <div className="chamfer-md card-depth flex h-full min-h-[390px] flex-col border border-clw-gold/20 bg-clw-black-2 p-7">
      <h2 className="font-display text-4xl uppercase tracking-wide text-clw-white">Practice groups</h2>
      <p className="mt-1 text-base leading-relaxed text-clw-gray">A place for every wrestler, whatever their level.</p>

      <div className="mt-6 space-y-2.5">
        {ORG.practiceGroups.map((group) => (
          <Link
            key={group}
            href="/signup"
            className="group flex items-center gap-4 rounded-md border border-clw-gold/20 bg-clw-black/55 px-4 py-4 transition-colors hover:border-clw-gold/50 hover:bg-clw-black/80"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-clw-gold/15 text-clw-gold-ink">
              <Shield className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold leading-tight text-clw-white">{group}</span>
              <span className="mt-0.5 block truncate text-sm leading-snug text-clw-gray">
                {GROUP_BLURBS[group] ?? 'A training group within the club.'}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
          </Link>
        ))}
      </div>

      <Link href="/signup" className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l">
        View all groups
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
