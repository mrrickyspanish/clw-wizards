import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import Link from 'next/link'
import { ArrowUpRight, CalendarHeart, LockKeyhole } from 'lucide-react'

import { DonationCheckoutForm } from '@/components/sponsorship/DonationCheckoutForm'
import { SupportPageHero } from '@/components/sponsorship/SupportPageHero'
import { TaxStatusNote } from '@/components/sponsorship/TaxStatusNote'
import { SupportStatusAlert } from '@/components/sponsorship/SupportStatusAlert'
import { CTA_LINK } from '@/lib/cta'

const BOOSTER_LEVELS = [
  {
    name: 'Supporter',
    amount: '$10 / Month',
    description: 'Helps with everyday room supplies and the small recurring needs that add up across a season.',
  },
  {
    name: 'Bronze Wizard',
    amount: '$25 / Month',
    description: 'Builds steady support for tournament access, practice essentials, and wrestler gear.',
  },
  {
    name: 'Silver Wizard',
    amount: '$50 / Month',
    description: 'Can help fund competition costs, athlete assistance, and consistent program resources.',
  },
  {
    name: 'Gold Wizard',
    amount: '$100 / Month',
    description: 'Creates dependable funding for scholarships, coaching development, and durable equipment.',
  },
  {
    name: 'Champion Circle',
    amount: '$250 / Month',
    description: 'Makes a major ongoing investment in access, facility needs, and season-long athlete development.',
  },
]

export const metadata: Metadata = pageMetadata({
  title: 'Monthly Boosters',
  description: 'Join the Wizards booster club with dependable monthly support for athlete access, equipment, competition, and program growth.',
})

export default async function BoostersPage({
  searchParams,
}: {
  searchParams: Promise<{ donation?: string }>
}) {
  const { donation } = await searchParams

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <SupportStatusAlert status={donation} successMessage="Thank you for joining the Wizards booster community." />

      <SupportPageHero
        eyebrow="Dependable support all season"
        title="Monthly Boosters"
        description="Monthly boosters give the club dependable funding it can plan around. That consistency helps the Wizards support athlete access, equipment, coaching resources, scholarships, and the everyday costs of building a stronger program."
        imageSrc="/images/real/clw-wizards-alumn-wisconsin.jpg"
        imageAlt="A Wizards alumnus continuing his wrestling journey"
        imagePosition="center 34%"
      />

      <section className="section-light bg-[#F7F4EA] px-5 py-12 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold-on-light">Booster Levels</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-ink">Choose your level of monthly impact.</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-clw-muted-dark sm:text-xl">
              Every level matters. The examples below show how recurring gifts can strengthen the program over time.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-5">
            {BOOSTER_LEVELS.map((level, index) => (
              <article
                key={level.name}
                className={`relative flex min-h-[205px] flex-col overflow-hidden border border-clw-ink/15 bg-white p-4 pt-7 shadow-lg shadow-black/5 sm:min-h-[285px] sm:p-5 sm:pt-8 ${
                  index === BOOSTER_LEVELS.length - 1 ? 'col-span-2 lg:col-span-1' : ''
                }`}
              >
                <span aria-hidden className={`absolute inset-x-0 top-0 h-2 ${index === BOOSTER_LEVELS.length - 1 ? 'bg-clw-gold' : index % 2 === 0 ? 'bg-clw-black' : 'bg-[#BFC3C9]'}`} />
                <CalendarHeart className="h-7 w-7 text-clw-gold-on-light sm:h-9 sm:w-9" strokeWidth={2.2} />
                <h3 className="mt-4 font-display text-2xl uppercase leading-none text-clw-ink sm:text-3xl">{level.name}</h3>
                <p className="mt-3 font-cond text-xl font-semibold uppercase tracking-wide text-clw-gold-on-light sm:text-2xl">{level.amount}</p>
                <p className="mt-3 hidden text-base font-medium leading-relaxed text-clw-muted-dark sm:block">{level.description}</p>
              </article>
            ))}
          </div>

          <p className="mt-4 text-center text-sm leading-relaxed text-clw-muted-dark/85">
            Examples reflect typical program needs. Actual costs and priorities vary throughout the season.
          </p>
        </div>
      </section>

      <section id="checkout" className="scroll-mt-32 bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Join the Booster Club</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-white">Build the room every month.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-clw-gray sm:text-xl">
              Select a monthly level or enter your own amount. Stripe will process the gift as a recurring monthly contribution.
            </p>
          </div>

          <div className="mt-8 border border-clw-gold/25 bg-clw-black-2 p-4 sm:mt-10 sm:p-8">
            <DonationCheckoutForm
              recurring
              presets={[10, 25, 50, 100, 250]}
              defaultAmount={25}
              buttonLabel="Give Monthly"
              returnPath="/sponsorship/boosters"
            />
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-clw-gray">
              <LockKeyhole className="h-4 w-4 text-clw-gold" /> Secure recurring checkout is processed by Stripe.
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
