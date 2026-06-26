import Link from 'next/link'

import { ORG } from '@/config/org.config'

function initialsFrom(name: string | null): string {
  if (!name) return 'CLW'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Mobile-only top app bar: identity on the left (tap to Profile), brand on the
// right. No notification bell until notifications actually exist.
export function MobileTopBar({ name }: { name: string | null }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-clw-gold/10 bg-clw-black/95 px-4 pb-3 backdrop-blur-md md:hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link href="/profile" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-clw-gold/30 font-display text-clw-gold">
          {initialsFrom(name)}
        </span>
        <span>
          <span className="block text-xs text-clw-gray">Welcome back</span>
          <span className="block font-medium leading-tight text-clw-white">{name ?? 'Wizard family'}</span>
        </span>
      </Link>
      <span className="font-display text-xl tracking-wide text-clw-gold">{ORG.shortName}</span>
    </header>
  )
}
