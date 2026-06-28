import type { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, GraduationCap, HandHeart, HeartHandshake, History, Mail, Plane, ShieldCheck, Users } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import type { Sponsor } from '@/types/database'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'
import { Button } from '@/components/ui/button'

const REASONS_TO_BELIEVE = [
  { label: '40+ years running', icon: History },
  { label: '100% volunteer-run', icon: HeartHandshake },
  { label: '501(c)(3) nonprofit, EIN #45-5192515', icon: ShieldCheck },
  { label: '120+ wrestlers funded each season', icon: Users },
]

const IMPACT_AREAS = [
  {
    name: 'Equipment & Facility',
    icon: Dumbbell,
    description: 'Mats, headgear, singlets, and the gear that keeps a volunteer-run program running season after season.',
  },
  {
    name: 'Tournament & Travel Support',
    icon: Plane,
    description: 'Entry fees and travel costs so no wrestler sits out a tournament because of cost.',
  },
  {
    name: 'Coaching & Development',
    icon: GraduationCap,
    description: 'Certifications and training for the volunteer coaches who show up every practice.',
  },
]

const SPONSOR_TIERS = [
  {
    name: 'White',
    amount: '$150',
    includes: 'Golf outing hole sponsorship.',
  },
  {
    name: 'Black',
    amount: '$250',
    includes: 'Everything in White, plus a sponsor banner & link on the Wizards website.',
  },
  {
    name: 'Yellow',
    amount: '$500',
    includes: 'Everything in Black, plus a year-end banquet book ad.',
  },
  {
    name: 'Platinum',
    amount: '$1,000',
    includes: 'Everything in Yellow, plus a sponsor golf sign.',
  },
  {
    name: 'Title',
    amount: '$1,500',
    includes: 'Everything in Platinum, plus homepage placement and the Wizards ticker on our website.',
  },
]

export const metadata: Metadata = {
  title: 'Sponsorship',
  description: 'Sponsorship opportunities that help underwrite the Crystal Lake Wizards.',
}

export default async function SponsorshipPage() {
  const supabase = await createServerSupabase()
  const { data: sponsors } = await supabase.from('sponsors').select('*').eq('active', true)
  const sponsorRows = (sponsors ?? []) as Sponsor[]

  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">
            Sponsorship opportunities
          </h1>
          <p className="mt-4 max-w-2xl text-clw-gray">
            Crystal Lake Wizards Wrestling Club is a 501(c)(3) nonprofit, run 100% by volunteers, now in our fifth
            decade. Sponsorship is what keeps registration affordable for our 120+ wrestlers, ages 5–14 — it funds
            the mats, the travel, the coaching, and the season itself. In return, your business gets in front of
            every Wizards family, all season long.
          </p>
        </div>
        <div className="chamfer-md card-depth overflow-hidden border border-clw-gold/10 bg-clw-black-2 lg:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- real team photo */}
          <img
            src="/images/real/team_tournament.jpg"
            alt="The Wizards wrestling team gathered on the mat at a tournament"
            className="h-64 w-full object-cover sm:h-72 lg:h-full"
          />
        </div>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS_TO_BELIEVE.map((reason) => (
          <div
            key={reason.label}
            className="chamfer-md card-depth flex items-center gap-3 border border-clw-gold/10 bg-clw-black-2 p-5"
          >
            <reason.icon className="h-6 w-6 shrink-0 text-clw-gold-ink" />
            <p className="text-base text-clw-gray">{reason.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Where your sponsorship goes</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {IMPACT_AREAS.map((area) => (
            <div key={area.name} className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-5">
              <area.icon className="h-6 w-6 text-clw-gold-ink" />
              <p className="mt-3 font-display text-lg uppercase tracking-wide text-clw-white">{area.name}</p>
              <p className="mt-2 flex-1 text-base leading-relaxed text-clw-gray">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Club sponsorship</h2>
        <p className="mt-1 text-base text-clw-gray">Each tier includes everything in the tier below it.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SPONSOR_TIERS.map((tier) => (
            <div key={tier.name} className="chamfer-md card-depth flex flex-col border border-clw-gold/10 bg-clw-black-2 p-5">
              <p className="font-cond text-sm uppercase tracking-[0.2em] text-clw-gold-ink">{tier.name} Sponsor</p>
              <p className="mt-2 font-display text-3xl text-clw-white">{tier.amount}</p>
              <p className="mt-3 flex-1 text-base leading-relaxed text-clw-gray">{tier.includes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 chamfer-md card-depth flex flex-col items-start gap-4 border border-clw-gold/10 bg-clw-black-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl uppercase tracking-wide text-clw-white">Golf outing — every August</p>
          <p className="text-base text-clw-gray">
            Our annual golf outing — every August. Sponsor a hole, grab a foursome, or come golf with us.
          </p>
        </div>
        <Button asChild size="lg" variant="outline" className="chamfer-sm w-full rounded-none sm:w-auto">
          <Link href="/golf-outing">See golf outing details</Link>
        </Button>
      </section>

      <section className="mt-8 chamfer-lg card-depth flex flex-col items-start gap-4 border border-clw-gold/15 bg-clw-black-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <HandHeart className="h-6 w-6 shrink-0 text-clw-gold-ink" />
          <div>
            <p className="font-display text-xl uppercase tracking-wide text-clw-white">
              Own a business? Become a Corporate Partner.
            </p>
            <p className="text-base text-clw-gray">
              Reach out and we&apos;ll get your business set up as a season sponsor — banner placement, website
              recognition, and a direct line to Crystal Lake wrestling families.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="chamfer-sm w-full rounded-none sm:w-auto">
          <a href={`mailto:${ORG.contactEmail}?subject=Sponsorship%20Inquiry`}>Become a Sponsor</a>
        </Button>
      </section>

      <section className="mt-8 chamfer-md card-depth flex flex-col gap-3 border border-clw-gold/10 bg-clw-black-2 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg uppercase tracking-wide text-clw-white">Ways to give</p>
          <p className="mt-2 max-w-md text-base leading-relaxed text-clw-gray">
            Prefer to mail a check? Make it payable to <span className="text-clw-white">Crystal Lake Wizards</span>{' '}
            and send it to {ORG.mailingAddress}.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-base text-clw-gray sm:text-right">
          <p className="flex items-center gap-2 sm:justify-end">
            <Mail className="h-4 w-4 text-clw-gold-ink" />
            <a href={`mailto:${ORG.contactEmail}`} className="hover:text-clw-gold">
              {ORG.contactEmail}
            </a>
          </p>
          <p className="text-clw-gray/70">EIN #{ORG.ein}</p>
        </div>
      </section>

      {sponsorRows.length > 0 && (
        <section className="mt-8">
          <p className="text-base text-clw-gray">Join the local businesses already backing the Wizards.</p>
          <div className="mt-4">
            <SponsorsShowcase sponsors={sponsorRows} />
          </div>
        </section>
      )}
    </main>
  )
}
