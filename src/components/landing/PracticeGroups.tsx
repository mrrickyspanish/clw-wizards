import Link from 'next/link'

import { ORG } from '@/config/org.config'

const GROUP_BLURBS: Record<string, string> = {
  Black: 'Advanced travel group.',
  Gold: 'Developing competitors.',
  White: 'Foundations and fundamentals.',
  'Wizard for Life': 'Alumni and lifelong members.',
}

export function PracticeGroups() {
  return (
    <div className="chamfer-md card-depth flex h-full min-h-[390px] flex-col border border-clw-gold/20 bg-clw-black-2 p-7">
      <h2 className="font-display text-4xl uppercase tracking-wide text-clw-white">Practice groups</h2>
      <p className="mt-1 text-base leading-relaxed text-clw-gray">A place for every level.</p>

      <div className="mt-6 space-y-2.5">
        {ORG.practiceGroups.map((group) => (
          <Link
            key={group}
            href="/signup"
            className="group flex items-center gap-4 rounded-md border border-clw-gold/20 bg-clw-black/55 px-4 py-4 transition-colors hover:border-clw-gold/50 hover:bg-clw-black/80"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-clw-gold/15 text-clw-gold-ink">●</span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold leading-tight text-clw-white">{group}</span>
              <span className="mt-0.5 block truncate text-sm leading-snug text-clw-gray">
                {GROUP_BLURBS[group] ?? 'Training group.'}
              </span>
            </span>
            <span className="text-clw-gray group-hover:text-clw-gold">›</span>
          </Link>
        ))}
      </div>

      <Link href="/signup" className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l">
        View all groups ›
      </Link>
    </div>
  )
}
