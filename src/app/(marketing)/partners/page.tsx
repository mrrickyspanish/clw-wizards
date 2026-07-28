import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor } from '@/types/database'
import { PartnersWall } from '@/components/sponsorship/PartnersShowcase'

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Meet the businesses and community partners who support Wizards Wrestling Club.',
  alternates: { canonical: '/partners' },
}

export default async function PartnersPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  const sponsors = (data ?? []) as Sponsor[]

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <section className="relative isolate overflow-hidden border-b border-clw-gold/30 bg-clw-black px-5 py-20 sm:px-8 sm:py-24 lg:min-h-[620px] lg:px-12 lg:py-28 xl:px-16 2xl:px-20">
        <div aria-hidden className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club sponsor wall photography */}
          <img
            src="/images/real/clw-wizards-gym-wall-sponsor.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.97)_0%,rgba(0,0,0,.88)_42%,rgba(0,0,0,.42)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-transparent to-clw-black/35" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col justify-center lg:min-h-[440px]">
          <div className="max-w-4xl">
            <p className="flex items-center gap-2.5 font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">
              <Star className="h-3.5 w-3.5 fill-current" /> Wizards Partners
            </p>
            <h1 className="mt-7 max-w-4xl uppercase leading-[0.86]">
              <span className="block font-cond text-[clamp(3.8rem,12vw,7rem)] font-light tracking-[-0.025em] text-clw-white">
                The businesses
              </span>
              <span className="block font-display text-[clamp(4.4rem,13vw,8rem)] font-black tracking-[-0.025em] text-clw-gold">
                behind the Wizards.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-clw-white/80 sm:text-2xl">
              These partners invest in the room, the athletes, and the opportunities that help Wizards wrestlers keep growing long after the final whistle.
            </p>
            <Link
              href="/sponsorship#sponsors"
              className="chamfer-sm mt-9 inline-flex h-14 items-center gap-3 bg-clw-gold px-7 font-cond text-base font-bold uppercase tracking-[0.14em] text-clw-black transition hover:bg-clw-gold-l"
            >
              Become a partner <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {sponsors.length > 0 ? (
        <PartnersWall sponsors={sponsors} />
      ) : (
        <section className="section-light bg-[#F7F4EA] px-5 py-20 text-clw-ink sm:px-8 lg:px-12 lg:py-24 xl:px-16 2xl:px-20">
          <div className="mx-auto max-w-4xl border border-dashed border-clw-ink/25 bg-white p-8 text-center sm:p-12">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.28em] text-clw-gold-on-light">Partner Wall</p>
            <h2 className="mt-5 font-display text-5xl uppercase leading-none sm:text-6xl">Recognition starts here.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-clw-muted-dark">
              Active sponsor logos and names will appear here automatically as businesses join the Wizards.
            </p>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden border-t border-clw-gold/25 bg-clw-gold px-5 py-16 text-clw-black sm:px-8 sm:py-20 lg:px-12 xl:px-16 2xl:px-20">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 select-none font-display text-[14rem] leading-none text-clw-black/[0.06] sm:text-[18rem]">W</div>
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.28em]">Put your business in their corner</p>
            <h2 className="mt-5 max-w-4xl font-display text-[clamp(3.4rem,9vw,6rem)] uppercase leading-[0.88]">
              Help build the next generation of Wizards.
            </h2>
          </div>
          <Link
            href="/sponsorship#sponsors"
            className="chamfer-sm inline-flex h-16 items-center justify-center gap-3 border-2 border-clw-black bg-clw-black px-8 font-cond text-lg font-bold uppercase tracking-[0.14em] text-clw-gold transition hover:bg-transparent hover:text-clw-black"
          >
            View sponsorship levels <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  )
}
