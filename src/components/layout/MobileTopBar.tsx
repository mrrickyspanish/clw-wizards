import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { ThemeToggle } from './ThemeToggle'

function initialsFrom(name: string | null): string {
  if (!name) return 'CLW'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Mobile-only top app bar. Minimal: avatar (tap to Profile) on the left, theme
// toggle + brand on the right. The greeting now lives big in the page body, so
// it isn't duplicated here.
export function MobileTopBar({ name, showAdminLink = false }: { name: string | null; showAdminLink?: boolean }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-clw-gold/10 bg-clw-black/95 px-4 pb-3 backdrop-blur-md md:hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Link
        href="/profile"
        aria-label="Profile"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-clw-gold/30 font-display text-clw-gold-ink"
      >
        {initialsFrom(name)}
      </Link>
      <div className="flex items-center gap-2">
        {showAdminLink && (
          <Link
            href="/admin"
            aria-label="Open admin dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-clw-gold/20 text-clw-white transition-colors hover:border-clw-gold/50 hover:text-clw-gold"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        )}
        <ThemeToggle />
        <span className="font-display text-xl tracking-wide text-clw-gold-ink">{ORG.shortName}</span>
      </div>
    </header>
  )
}
