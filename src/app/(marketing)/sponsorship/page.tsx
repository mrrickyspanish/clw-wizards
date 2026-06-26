import type { Metadata } from 'next'
import { HandHeart } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import type { Sponsor } from '@/types/database'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'
import { Button } from '@/components/ui/button'

const SPONSOR_TIERS = [
  { name: 'White', amount: '$150' },
  { name: 'Black', amount: '$250' },
  { name: 'Yellow', amount: '$500' },
  { name: 'Platinum', amount: '$1,000' },
]

const GOLF_TIERS = [
  {
    name: 'Individual Golfer',
    amount: '$150',
    includes: '18 holes, cart, range, gift bag, 10 raffle tickets, food & drink.',
  },
  {
    name: 'Foursome',
    amount: '$600',
    includes: '18 holes, 2 carts, range, 4 gift bags, 15 raffle tickets per golfer, food & drink.',
  },
  {
    name: 'Corporate Foursome',
    amount: '$1,000',
    includes: 'Everything in Foursome, plus 20 raffle tickets per golfer and hole sponsorship.',
  },
  {
    name: 'VIP Corporate Sponsor',
    amount: '$2,500',
    includes: 'Everything in Foursome, plus a website banner, banquet ad, VIP sign, and 30 raffle tickets per golfer.',
  },
]

export const metadata: Metadata = {
  title: 'Sponsorship',
  description: 'Sponsorship and golf outing opportunities that help underwrite the Crystal Lake Wizards.',
}

export default async function SponsorshipPage() {
  const supabase = await createServerSupabase()
  const { data: sponsors } = await supabase.from('sponsors').select('*').eq('active', true)
  const sponsorRows = (sponsors ?? []) as Sponsor[]

  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">
          Sponsorship opportunities
        </h1>
        <p className="mt-4 text-clw-gray">
          CLW Wrestling is a 501(c)(3) nonprofit run 100% by volunteers. Local business sponsorships underwrite the
          cost of the program for every family.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Club sponsorship</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPONSOR_TIERS.map((tier) => (
            <div key={tier.name} className="chamfer-md card-depth border border-clw-gold/10 bg-clw-black-2 p-5">
              <p className="font-cond text-xs uppercase tracking-[0.2em] text-clw-gold-ink">{tier.name} Sponsor</p>
              <p className="mt-2 font-display text-3xl text-clw-white">{tier.amount}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Golf outing</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GOLF_TIERS.map((tier) => (
            <div key={tier.name} className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-5">
              <p className="font-cond text-xs uppercase tracking-[0.2em] text-clw-gold-ink">{tier.name}</p>
              <p className="mt-2 font-display text-3xl text-clw-white">{tier.amount}</p>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-clw-gray">{tier.includes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 chamfer-lg card-depth flex flex-col items-start gap-4 border border-clw-gold/15 bg-clw-black-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <HandHeart className="h-6 w-6 shrink-0 text-clw-gold-ink" />
          <div>
            <p className="font-display text-xl uppercase tracking-wide text-clw-white">Become a sponsor</p>
            <p className="text-sm text-clw-gray">Reach out and we&apos;ll get you set up for this season.</p>
          </div>
        </div>
        <Button asChild size="lg" className="chamfer-sm w-full rounded-none sm:w-auto">
          <a href={`mailto:${ORG.contactEmail}?subject=Sponsorship%20Inquiry`}>Become a Sponsor</a>
        </Button>
      </section>

      {sponsorRows.length > 0 && (
        <section className="mt-8">
          <SponsorsShowcase sponsors={sponsorRows} />
        </section>
      )}
    </main>
  )
}
