import Link from 'next/link'

import { ORG } from '@/config/org.config'

// Shared brand mark above auth cards: ties the login/signup screens to the
// landing and gives a way back home.
export function AuthBrand() {
  return (
    <Link href="/" className="mb-8 block text-center">
      <span className="font-display text-4xl tracking-wide text-clw-gold">{ORG.shortName}</span>
      <span className="mt-1 block font-cond text-sm uppercase tracking-[0.3em] text-clw-gray">
        Wrestling Club
      </span>
    </Link>
  )
}
