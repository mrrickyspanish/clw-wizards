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
    <div className="chamfer-md card-depth flex h-full min-h-[390px] flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Practice groups</h2>
      <p className="mt-1 text-sm text-clw-gray">A place for every wrestler, whatever their level.</p>

      <div className="mt-5 space-y-2">
        {ORG.practiceGroups.map((group) => (
          <Link
            key={group}
            href="/signup"
            className="group flex items-center gap-3 rounded-md border border-clw-gold/10 bg-clw-black/40 px-3.5 py-3.5 transition-colors hover:border-clw-gold/40 hover:bg-clw-black/70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-clw-gold/10 text-clw-gold-ink">
              <Shield className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-clw-white">{group}</span>
              <span className="block truncate text-xs text-clw-gray">{GROUP_BLURBS[group] ?? 'A training group within the club.'}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-clw-gray transition-colors group-hover:text-clw-gold" />
          </Link>
        ))}
      </div>

      <Link href="/signup" className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l">
        View all groups
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
