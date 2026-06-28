import type { Metadata } from 'next'
import Link from 'next/link'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

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
    name: 'Wizard VIP Corporate Sponsor',
    amount: '$2,500',
    includes:
      'A golf foursome, 2 carts, range, 4 gift bags, and 30 raffle tickets per golfer, plus hole sponsorship, a banquet book ad, a VIP sponsor golf sign, and homepage banner placement. Includes the sausage bar at the turn, two drink tickets, dinner, a logo tumbler, and a Wizards golf outing polo.',
  },
]

export const metadata: Metadata = {
  title: 'Golf Outing',
  description: "Join the Crystal Lake Wizards' annual golf outing, held every August.",
}

export default function GolfOutingPage() {
  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Annual fundraiser — every August</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">
            The Wizards golf outing
          </h1>
          <p className="mt-4 max-w-2xl text-clw-gray">
            Our biggest fundraiser of the year — and the most fun way to back the Wizards. Grab a foursome, sponsor a
            hole, or come out and golf with us. Every dollar raised goes straight back into mats, travel, and
            coaching for the season ahead.
          </p>
        </div>
        <div className="chamfer-md card-depth overflow-hidden border border-clw-gold/10 bg-clw-black-2 lg:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- real team photo */}
          <img
            src="/images/real/coaches_trophy.jpg"
            alt="Wizards coaches with a championship trophy"
            className="h-64 w-full object-cover sm:h-72 lg:h-full"
          />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Golf outing tiers</h2>
        <p className="mt-1 text-base text-clw-gray">Each tier includes everything in the tier below it.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GOLF_TIERS.map((tier) => (
            <div key={tier.name} className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-5">
              <p className="font-cond text-sm uppercase tracking-[0.2em] text-clw-gold-ink">{tier.name}</p>
              <p className="mt-2 font-display text-3xl text-clw-white">{tier.amount}</p>
              <p className="mt-3 flex-1 text-base leading-relaxed text-clw-gray">{tier.includes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 chamfer-lg card-depth flex flex-col items-start gap-4 border border-clw-gold/15 bg-clw-black-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl uppercase tracking-wide text-clw-white">Reserve your spot</p>
          <p className="text-base text-clw-gray">Reach out and we&apos;ll get you signed up for this year&apos;s outing.</p>
        </div>
        <Button asChild size="lg" className="chamfer-sm w-full rounded-none sm:w-auto">
          <a href={`mailto:${ORG.contactEmail}?subject=Golf%20Outing%20Sponsorship`}>Become a Sponsor</a>
        </Button>
      </section>

      <p className="mt-8 text-base text-clw-gray">
        Looking for season-long sponsorship instead?{' '}
        <Link href="/sponsorship" className="text-clw-gold-ink hover:text-clw-gold">
          See club sponsorship opportunities →
        </Link>
      </p>
    </main>
  )
}
