import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import Link from 'next/link'
import { ArrowUpRight, LockKeyhole } from 'lucide-react'

import { DonationCheckoutForm } from '@/components/sponsorship/DonationCheckoutForm'
import { SupportImpactChart } from '@/components/sponsorship/SupportImpactChart'
import { SupportPageHero } from '@/components/sponsorship/SupportPageHero'
import { TaxStatusNote } from '@/components/sponsorship/TaxStatusNote'
import { SupportStatusAlert } from '@/components/sponsorship/SupportStatusAlert'
import { CTA_LINK } from '@/lib/cta'

export const metadata: Metadata = pageMetadata({
  title: 'One-Time Donation',
  description: 'Make a one-time gift to support athlete access, equipment, competition, coaching, and the Wizards wrestling room.',
})

export default async function DonationPage({
  searchParams,
}: {
  searchParams: Promise<{ donation?: string }>
}) {
  const { donation } = await searchParams

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <SupportStatusAlert status={donation} successMessage="Thank you. Your donation to the Wizards was received." />

      <SupportPageHero
        eyebrow="Direct support for the room"
        title="One-Time Donation"
        description="A one-time gift gives Wizards Wrestling Club flexible support for the needs that matter most right now, from tournament access and athlete gear to coaching resources, scholarships, and facility improvements."
        imageSrc="/images/real/clw-wizards-youth-win.jpg"
        imageAlt="Wizards wrestlers celebrating together after competition"
        imagePosition="center 45%"
      />

      <section className="section-light bg-[#F7F4EA] px-5 py-12 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <SupportImpactChart compact />
      </section>

      <section id="checkout" className="scroll-mt-32 bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Choose Your Gift</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-white">Support the Wizards today.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-clw-gray sm:text-xl">
              Select an amount or enter your own. You will continue to Stripe to complete the secure payment.
            </p>
          </div>

          <div className="mt-8 border border-clw-gold/25 bg-clw-black-2 p-4 sm:mt-10 sm:p-8">
            <DonationCheckoutForm
              presets={[25, 50, 100, 250, 500]}
              defaultAmount={50}
              buttonLabel="Donate"
              returnPath="/sponsorship/donate"
            />
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-clw-gray">
              <LockKeyhole className="h-4 w-4 text-clw-gold" /> Secure checkout is processed by Stripe.
            </p>
            <TaxStatusNote className="mt-4 text-center text-clw-gray/85" />
          </div>

          <div className="mt-8 text-center">
            <Link href="/sponsorship" className={`${CTA_LINK} text-clw-gold hover:text-clw-gold-l`}>
              View every way to support <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
