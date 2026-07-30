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
        <div className="px-5 pt-24 sm:px-8">
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

      <section id="donate" className="scroll-mt-28 bg-[#F7F7F7] px-5 py-10 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-cond text-xs uppercase tracking-[0.28em] text-clw-gold-on-light sm:text-sm sm:tracking-[0.32em]">One-Time Support</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:mt-6 sm:text-6xl">Make a Donation</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-clw-black/70 sm:mt-6 sm:text-xl">Your gift helps cover tournament fees, practice equipment, scholarships, travel assistance, and facility improvements.</p>
          <DonationCheckoutForm presets={[25, 50, 100, 250]} defaultAmount={50} buttonLabel="Donate" light />
        </div>
      </section>

      <GoldRule />

      <section id="boosters" className="scroll-mt-28 bg-clw-black px-5 py-12 text-clw-white sm:px-10 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-cond text-xs uppercase tracking-[0.28em] text-clw-gold sm:text-sm sm:tracking-[0.32em]">Monthly Support</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:mt-6 sm:text-6xl">Join the Booster Club</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-clw-gray sm:mt-6 sm:text-xl">Monthly supporters give the club dependable funding for equipment, coaching resources, athlete development, and scholarships.</p>
          <DonationCheckoutForm recurring presets={[10, 25, 50, 100, 250]} defaultAmount={25} buttonLabel="Give Monthly" />
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-12">
            {BOOSTER_LEVELS.map(([name, amount], index) => (
              <div key={name} className={`border border-clw-gold/20 bg-clw-black-2 p-4 text-left sm:p-5 ${index === BOOSTER_LEVELS.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <p className="font-display text-lg uppercase text-clw-white sm:text-2xl">{name}</p>
                <p className="mt-1.5 font-cond text-base tracking-wide text-clw-gold sm:mt-2 sm:text-xl">{amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GoldRule />

      <section id="sponsors" className="section-light scroll-mt-28 bg-[#F7F4EA] px-5 py-10 text-clw-ink sm:px-10 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-cond text-xs font-semibold uppercase tracking-[0.28em] text-clw-gold-on-light sm:text-sm sm:tracking-[0.32em]">Business Support</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:mt-6 sm:text-6xl">Corporate Sponsorship</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-clw-muted-dark sm:mt-6 sm:text-xl">
              Put your business behind the wrestlers, families, and community that make the Wizards room special. Every level creates direct support for athlete development while giving your brand meaningful visibility with the club.
            </p>
          </div>

          <PartnersProof sponsors={sponsors} />

          <div className="mt-9 border-t border-clw-ink/15 pt-8 sm:mt-14 sm:pt-12">
            <div className="flex flex-col gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
              <div>
                <p className="font-cond text-xs font-semibold uppercase tracking-[0.24em] text-clw-gold-on-light sm:text-sm sm:tracking-[0.28em]">Choose your level</p>
                <h3 className="mt-3 font-display text-3xl uppercase leading-none sm:mt-4 sm:text-5xl">Find the right way to back the room.</h3>
              </div>
              <Link href="/partners" className="inline-flex items-center justify-center gap-2 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold-on-light hover:text-clw-ink sm:text-base sm:tracking-[0.16em]">
                View the full partner wall <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
              {tiers.map((tier) => (
                <div key={tier.slug} className="chamfer-md relative overflow-hidden border border-clw-ink/15 bg-white p-4 pl-6 text-clw-ink shadow-lg shadow-black/5 sm:p-6 sm:pl-8">
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-2.5 ${tierBandClass(tier.slug)}`} />
                  <p className="font-cond text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-clw-muted-dark sm:text-sm sm:tracking-[0.18em]">Sponsorship Level</p>
                  <p className="mt-3 font-display text-xl uppercase leading-none text-clw-ink sm:mt-4 sm:text-3xl">{tier.label}</p>
                  <p className="mt-3 font-cond text-xl font-semibold tracking-wide text-clw-gold-on-light sm:mt-4 sm:text-2xl">{tierPrice(tier.price_cents)}</p>
                </div>
              ))}
            </div>

            <SponsorCheckoutForm tiers={tiers} />
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 bg-[#F7F7F7] px-5 py-10 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-cond text-xs uppercase tracking-[0.28em] text-clw-gold-on-light sm:text-sm sm:tracking-[0.32em]">Talk With Wizards Wrestling Club</p>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:mt-6 sm:text-6xl">Get in Touch</h2>
          <div className="mt-6 grid gap-4 text-base sm:mt-8 sm:grid-cols-2 sm:gap-6 sm:text-lg">
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
