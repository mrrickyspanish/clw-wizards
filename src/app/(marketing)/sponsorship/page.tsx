import type { Metadata } from 'next'
import { Mail, MapPin } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor } from '@/types/database'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupportOverview } from '@/components/sponsorship/SupportOverview'
import { DonationCheckoutForm } from '@/components/sponsorship/DonationCheckoutForm'
import { SponsorCheckoutForm } from '@/components/sponsorship/SponsorCheckoutForm'
import { ContactForm } from '@/components/sponsorship/ContactForm'
import { GoldRule } from '@/components/sponsorship/SupportMedia'

const FACILITY_ADDRESS = '975 Nimco Dr, Unit L, Crystal Lake, IL 60014'

const BOOSTER_LEVELS = [
  ['Supporter', '$10 / Month'],
  ['Bronze Wizard', '$25 / Month'],
  ['Silver Wizard', '$50 / Month'],
  ['Gold Wizard', '$100 / Month'],
  ['Champion Circle', '$250 / Month'],
]

const SPONSOR_TIERS = [
  ['White Sponsor', '$150'],
  ['Black Sponsor', '$250'],
  ['Gold Sponsor', '$500'],
  ['Platinum Sponsor', '$1,000'],
]

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
  const { data } = await supabase.from('sponsors').select('*').eq('active', true)
  const sponsors = (data ?? []) as Sponsor[]

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
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">One-Time Support</p>
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

      <section id="sponsors" className="scroll-mt-28 bg-clw-white px-7 py-16 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Business Support</p>
            <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Corporate Sponsorship</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPONSOR_TIERS.map(([name, amount]) => (
              <div key={name} className="bg-clw-black p-6 text-clw-white">
                <p className="font-display text-2xl uppercase">{name}</p>
                <p className="mt-3 font-cond text-2xl tracking-wide text-clw-gold">{amount}</p>
              </div>
            ))}
          </div>
          <SponsorCheckoutForm />
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 bg-[#F7F7F7] px-7 py-16 text-clw-black sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Talk With Wizards Wrestling Club</p>
          <h2 className="mt-6 font-display text-5xl uppercase leading-none sm:text-6xl">Get in Touch</h2>
          <div className="mt-8 grid gap-6 text-lg sm:grid-cols-2">
            <p className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />{FACILITY_ADDRESS}</p>
            <a href={`mailto:${ORG.contactEmail}`} className="flex items-start gap-3 underline decoration-clw-gold decoration-4 underline-offset-4"><Mail className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />{ORG.contactEmail}</a>
          </div>
          <ContactForm />
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="bg-clw-black px-7 py-14 sm:px-10">
          <div className="mx-auto max-w-5xl"><SponsorsShowcase sponsors={sponsors} /></div>
        </section>
      )}

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
