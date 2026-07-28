import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor, SponsorTierRow } from '@/types/database'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupportOverview } from '@/components/sponsorship/SupportOverview'
import { DonationCheckoutForm } from '@/components/sponsorship/DonationCheckoutForm'
import { SponsorCheckoutForm } from '@/components/sponsorship/SponsorCheckoutForm'
import { ContactForm } from '@/components/sponsorship/ContactForm'
import { PartnersProof } from '@/components/sponsorship/PartnersShowcase'
import { GoldRule } from '@/components/sponsorship/SupportMedia'

const FACILITY_ADDRESS = '975 Nimco Dr, Unit L, Crystal Lake, IL 60014'

const BOOSTER_LEVELS = [
  ['Supporter', '$10 / Month'],
  ['Bronze Wizard', '$25 / Month'],
  ['Silver Wizard', '$50 / Month'],
  ['Gold Wizard', '$100 / Month'],
  ['Champion Circle', '$250 / Month'],
]

function tierPrice(cents: number | null) {
  if (cents == null) return 'Contact us'
  return `$${(cents / 100).toLocaleString('en-US')}`
}

export const metadata: Metadata = {
  title: 'Support the Club',
  description: 'Donation, booster, sponsorship, and volunteer opportunities for Wizards Wrestling Club.',
}

export default async function SponsorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ donation?: string; sponsor?: string }>
}) {
  const { donation, sponsor } = await searchParams
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })
  const sponsors = (data ?? []) as Sponsor[]

  const { data: tierData } = await supabase
    .from('sponsor_tiers')
    .select('*')
    .eq('active', true)
    .eq('public_checkout', true)
    .order('sort_order', { ascending: true })
  const tiers = (tierData ?? []) as SponsorTierRow[]

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      {(donation || sponsor) && (
        <div className="px-6 pt-24 sm:px-8">
          {(donation === 'success' || sponsor === 'success') && (
            <Alert className="mx-auto max-w-3xl border-clw-gold/40 bg-clw-gold/10">
              <AlertDescription className="text-clw-gold">Thank you for supporting the Wizards. Your payment was received.</AlertDescription>
            </Alert>
          )}
          {(donation === 'cancelled' || sponsor === 'cancelled') && (
            <Alert className="mx-auto max-w-3xl border-clw-white/20 bg-clw-black-2">
              <AlertDescription className="text-clw-gray">Checkout was cancelled. No payment was made.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <SupportOverview />
      <GoldRule />

      <section id="donate" className="scroll-mt-28 bg-[#F7F7F7] px-7 py-16 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light">One-Time Support</p>
          <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Make a Donation</h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-clw-black/70">Your gift helps cover tournament fees, practice equipment, scholarships, travel assistance, and facility improvements.</p>
          <DonationCheckoutForm presets={[25, 50, 100, 250]} defaultAmount={50} buttonLabel="Donate" light />
        </div>
      </section>

      <GoldRule />

      <section id="boosters" className="scroll-mt-28 bg-clw-black px-7 py-20 text-clw-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Monthly Support</p>
          <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Join the Booster Club</h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-clw-gray">Monthly supporters give the club dependable funding for equipment, coaching resources, athlete development, and scholarships.</p>
          <DonationCheckoutForm recurring presets={[10, 25, 50, 100, 250]} defaultAmount={25} buttonLabel="Give Monthly" />
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {BOOSTER_LEVELS.map(([name, amount]) => (
              <div key={name} className="border border-clw-gold/20 bg-clw-black-2 p-5 text-left">
                <p className="font-display text-2xl uppercase text-clw-white">{name}</p>
                <p className="mt-2 font-cond text-xl tracking-wide text-clw-gold">{amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoldRule />

      <section id="sponsors" className="section-light scroll-mt-28 bg-[#F7F4EA] px-7 py-16 text-clw-ink sm:px-10 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.32em] text-clw-gold-on-light">Business Support</p>
            <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Corporate Sponsorship</h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-clw-muted-dark">
              Put your business behind the wrestlers, families, and community that make the Wizards room special. Every level creates direct support for athlete development while giving your brand meaningful visibility with the club.
            </p>
          </div>

          <PartnersProof sponsors={sponsors} />

          <div className="mt-14 border-t border-clw-ink/15 pt-12">
            <div className="flex flex-col gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
              <div>
                <p className="font-cond text-sm font-semibold uppercase tracking-[0.28em] text-clw-gold-on-light">Choose your level</p>
                <h3 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">Find the right way to back the room.</h3>
              </div>
              <Link href="/partners" className="inline-flex items-center justify-center gap-2 font-cond text-base font-semibold uppercase tracking-[0.16em] text-clw-gold-on-light hover:text-clw-ink">
                View the full partner wall <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => (
                <div key={tier.slug} className="chamfer-md border border-clw-gold/35 bg-[#0B0B0B] p-6 text-white shadow-xl shadow-black/10">
                  <p className="font-cond text-sm font-semibold uppercase tracking-[0.18em] text-clw-gold">Sponsorship Level</p>
                  <p className="mt-4 font-display text-3xl uppercase leading-none text-white">{tier.label}</p>
                  <p className="mt-4 font-cond text-2xl font-semibold tracking-wide text-clw-gold">{tierPrice(tier.price_cents)}</p>
                </div>
              ))}
            </div>

            <SponsorCheckoutForm tiers={tiers} />
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 bg-[#F7F7F7] px-7 py-16 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light">Talk With Wizards Wrestling Club</p>
          <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Get in Touch</h2>
          <div className="mt-8 grid gap-6 text-lg sm:grid-cols-2">
            <p className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />{FACILITY_ADDRESS}</p>
            <a href={`mailto:${ORG.contactEmail}`} className="flex items-start gap-3 underline decoration-clw-gold decoration-4 underline-offset-4"><Mail className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />{ORG.contactEmail}</a>
          </div>
          <ContactForm />
        </div>
      </section>

      <div className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-clw-gold/10 bg-clw-black/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-3 gap-3">
          <a href="#donate" className="chamfer-sm flex h-14 items-center justify-center bg-clw-gold text-sm font-bold uppercase tracking-wider text-clw-black">Donate</a>
          <a href="#sponsors" className="chamfer-sm flex h-14 items-center justify-center border-2 border-clw-gold text-sm font-bold uppercase tracking-wider text-clw-gold">Sponsor</a>
          <a href="#boosters" className="chamfer-sm flex h-14 items-center justify-center border-2 border-clw-gold text-sm font-bold uppercase tracking-wider text-clw-gold">Boosters</a>
        </div>
      </div>
    </main>
  )
}
