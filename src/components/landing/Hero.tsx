import Link from 'next/link'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-clw-gold/10 bg-clw-black">
      <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        {/* Text wordmark stands in until a logo asset is provided. */}
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-clw-gold/80">{ORG.shortName}</p>
        <h1 className="mt-4 font-display text-5xl text-clw-white sm:text-7xl">{ORG.name}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-clw-gray">{ORG.tagline}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Create your account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Parent / Staff sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
