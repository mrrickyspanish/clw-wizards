import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import Link from 'next/link'
import { ArrowUpRight, Building2, Megaphone, ShieldCheck, Users } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor, SponsorTierRow } from '@/types/database'
import { PartnersProof } from '@/components/sponsorship/PartnersShowcase'
import { SponsorCheckoutForm } from '@/components/sponsorship/SponsorCheckoutForm'
import { SupportPageHero } from '@/components/sponsorship/SupportPageHero'
import { TaxStatusNote } from '@/components/sponsorship/TaxStatusNote'
import { SupportStatusAlert } from '@/components/sponsorship/SupportStatusAlert'

const SPONSORSHIP_IMPACT = [
  {
    title: 'Athlete Opportunity',
    description: 'Support helps lower barriers to competition, gear, travel, and participation for Wizards families.',
    Icon: Users,
  },
  {
    title: 'A Stronger Room',
    description: 'Business support helps fund equipment, facility needs, safety supplies, and the day-to-day wrestling environment.',
    Icon: Building2,
  },
  {
    title: 'Community Visibility',
    description: 'Sponsors are recognized across the club’s website, facility, events, and family network based on package level.',
    Icon: Megaphone,
  },
  {
    title: 'Local Alignment',
    description: 'Your brand stands beside a youth organization built around discipline, confidence, hard work, and community.',
    Icon: ShieldCheck,
  },
]

function tierPrice(cents: number | null) {
  if (cents == null) return 'Contact us'
  return `$${(cents / 100).toLocaleString('en-US')}`
}

function tierBandClass(slug: string) {
  switch (slug) {
    case 'white':
      return 'bg-white ring-1 ring-inset ring-clw-ink/25'
    case 'black':
      return 'bg-[#111111]'
    case 'yellow':
      return 'bg-clw-gold'
    case 'platinum':
      return 'bg-[#BFC3C9]'
    default:
      return 'bg-clw-gold'
  }
}

export const metadata: Metadata = pageMetadata({
  title: 'Corporate Sponsorship',
  description: 'Review Wizards Wrestling Club corporate sponsorship levels and support local youth wrestlers while building community visibility.',
})

export default async function SponsorPage({
  searchParams,
}: {
  searchParams: Promise<{ sponsor?: string }>
}) {
  const { sponsor } = await searchParams
  const supabase = await createServerSupabase()

  const [{ data: sponsorData }, { data: tierData }] = await Promise.all([
    supabase.from('sponsors').select('*').eq('active', true).order('name', { ascending: true }),
    supabase
      .from('sponsor_tiers')
      .select('*')
      .eq('active', true)
      .eq('public_checkout', true)
      .order('sort_order', { ascending: true }),
  ])

  const sponsors = (sponsorData ?? []) as Sponsor[]
  const tiers = (tierData ?? []) as SponsorTierRow[]

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <SupportStatusAlert status={sponsor} successMessage="Thank you. Your Wizards sponsorship payment was received." />

      <SupportPageHero
        eyebrow="Business support with local impact"
        title="Corporate Sponsorship"
        description="Corporate sponsors help Wizards Wrestling Club create access, strengthen the training room, and provide better opportunities for young wrestlers. In return, the club gives local businesses meaningful recognition across a highly engaged family and community network."
        imageSrc="/images/real/clw-wizards-gym-wall-sponsor.jpg"
        imageAlt="Sponsor recognition inside the Wizards wrestling room"
        imagePosition="center"
      />

      <section className="bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Why Partner With the Wizards</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-white">Back the room. Build local connection.</h2>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
            {SPONSORSHIP_IMPACT.map(({ title, description, Icon }) => (
              <article key={title} className="min-h-[190px] border border-clw-gold/25 bg-clw-black-2 p-4 sm:min-h-[255px] sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clw-gold text-clw-black sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 font-display text-2xl uppercase leading-none text-clw-white sm:text-3xl">{title}</h3>
                <p className="mt-3 hidden text-base font-medium leading-relaxed text-clw-gray sm:block">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-light bg-[#F7F4EA] px-5 py-12 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold-on-light">Sponsorship Levels</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-ink">Find the right way to back the room.</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-clw-muted-dark sm:text-xl">
              Select the level that fits your business. Package pricing is managed by the club and checkout uses the current published amount.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
            {tiers.map((tier) => (
              <article key={tier.slug} className="chamfer-md relative overflow-hidden border border-clw-ink/15 bg-white p-4 pl-6 text-clw-ink shadow-lg shadow-black/5 sm:p-6 sm:pl-8">
                <span aria-hidden className={`absolute inset-y-0 left-0 w-2.5 ${tierBandClass(tier.slug)}`} />
                <p className="font-cond text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clw-muted-dark sm:text-sm sm:tracking-[0.18em]">Sponsorship Level</p>
                <h3 className="mt-3 font-display text-xl uppercase leading-none text-clw-ink sm:mt-4 sm:text-3xl">{tier.label}</h3>
                <p className="mt-3 font-cond text-xl font-semibold tracking-wide text-clw-gold-on-light sm:mt-4 sm:text-2xl">{tierPrice(tier.price_cents)}</p>
              </article>
            ))}
          </div>

          <PartnersProof sponsors={sponsors} />

          <div id="checkout" className="scroll-mt-32 mt-10 border-t border-clw-ink/15 pt-10 sm:mt-14 sm:pt-14">
            <div className="mx-auto max-w-4xl text-center">
              <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold-on-light">Become a Partner</p>
              <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5rem)] uppercase leading-[0.88] text-clw-ink">Choose your package and continue to Stripe.</h2>
            </div>
            <SponsorCheckoutForm tiers={tiers} returnPath="/sponsorship/sponsor" />
            <TaxStatusNote variant="sponsorship" className="mx-auto mt-6 max-w-3xl text-center text-clw-muted-dark" />
          </div>

          <div className="mt-8 text-center">
            <Link href="/sponsorship" className="inline-flex items-center gap-2 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold-on-light hover:text-clw-ink">
              View every way to support <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
