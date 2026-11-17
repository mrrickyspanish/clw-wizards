import Link from 'next/link'

import { CHURCH_READ_ONLY, READ_ONLY_MESSAGE } from '@/lib/demo-readonly'

/** Church demo only: a strip saying nothing is saved, with a way back to the views. */
export function ReadOnlyBanner() {
  if (!CHURCH_READ_ONLY) return null
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-clw-gold/40 bg-clw-black-2 px-4 py-2 text-center text-base text-clw-white print:hidden">
      <span>{READ_ONLY_MESSAGE}</span>
      <Link href="/demo" prefetch={false} className="font-semibold text-clw-gold underline-offset-4 hover:underline">
        Switch view
      </Link>
    </div>
  )
}
