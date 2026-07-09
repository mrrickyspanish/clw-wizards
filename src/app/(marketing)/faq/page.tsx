import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, HelpCircle, Mail } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ORG } from '@/config/org.config'

const FAQS = [
  {
    q: 'How do I register, and what does it cost?',
    a: 'Registration includes a mandatory fundraiser: each wrestler sells 20 raffle tickets at $5 each ($100 total), so it costs your family $0, or you can buy out the books for a $50 credit toward tournaments. Separately, every family must purchase a USA Wrestling card online for each wrestler. Seasonal amounts and deadlines should be confirmed directly with the club before registering.',
  },
  {
    q: 'What do I need to bring to practice?',
    a: 'Shorts and a T-shirt without hoods, snaps, or zippers, plus a labeled water bottle. Wrestling shoes and headgear are needed once the wrestler begins regular practice. Please keep outside shoes off the mats.',
  },
  {
    q: 'How are practice groups organized?',
    a: 'Coaches place wrestlers where they will have the most success based on age, experience, maturity, technique, and practice readiness. Wrestlers may move groups as they develop or when they need a different level of challenge.',
  },
  {
    q: 'Do I need a singlet?',
    a: 'Singlets are worn at tournaments when representing Wizards Wrestling Club. Wrestlers purchase and keep their own singlet; rentals are rare. Confirm current pricing and availability with the club.',
  },
  {
    q: 'What do tournaments cost, and are they mandatory?',
    a: 'Tournaments are voluntary. The club typically attends one or two each weekend beginning in December. Entry fees are separate from club registration and are paid per event. Confirm current fees before registering for a tournament.',
  },
  {
    q: 'What are the IKWF age divisions?',
    a: 'IKWF divisions generally include Tots, Bantam, Midget, Novice, and Senior. Exact eligibility is determined by the current IKWF season rules and the wrestler’s age.',
  },
  {
    q: 'Can I coach or watch practice?',
    a: 'Coaching, or being inside the practice room beyond the club’s parent-viewing rules, may require a USA Wrestling coach card and applicable screening. Parent access varies by practice group and facility capacity. Ask the club what applies to your wrestler’s group.',
  },
  {
    q: 'Can we visit before joining?',
    a: 'New families should contact the club before arriving. A club leader can confirm the appropriate practice, whether the wrestler may participate or observe, and any waiver or equipment requirements for the visit.',
  },
  {
    q: 'Where do I park?',
    a: 'The facility is at 975 Nimco Dr, Unit L, Crystal Lake. Spots along the building are limited, with additional parking to the west. Please do not park in front of the garage door.',
  },
]

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about joining Wizards Wrestling Club, practice, equipment, tournaments, and coaching.',
}

export default function FaqPage() {
  return (
    <main className="relative overflow-hidden bg-clw-black pb-16 text-clw-white lg:pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_80%_4%,rgba(240,192,32,.13),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_35%)]" />

      <section className="mission-frame relative py-12 sm:py-16 lg:py-20">
        <header className="max-w-4xl">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-clw-gold" />
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">New Family Questions</p>
          </div>
          <h1 className="mt-5 font-display text-5xl uppercase leading-[0.92] text-clw-white sm:text-6xl lg:text-7xl">
            Answers before your wrestler steps into the room.
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed">
            Registration, equipment, practices, tournaments, and the first visit—all in one place.
          </p>
        </header>

        <div className="chamfer-md card-depth mt-10 border border-clw-gold/15 bg-clw-black-2 p-5 sm:p-7 lg:p-9">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} value={q} className="border-clw-gold/15">
                <AccordionTrigger className="py-6 text-left text-lg font-semibold leading-snug text-clw-white hover:no-underline hover:text-clw-gold sm:text-xl">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="max-w-4xl pb-6 text-lg leading-relaxed text-clw-gray">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <section className="mt-6 grid gap-5 border border-clw-gold/20 bg-clw-black-2 p-7 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">Still Unsure?</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl">Start with the new-family guide.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-clw-gray">
              See what families can expect, how training groups work, and the safest next step before creating an account.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/join" className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black hover:bg-clw-gold-l">
              New Families <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`mailto:${ORG.contactEmail}`} className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-gold/35 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold hover:border-clw-gold">
              Ask the Club <Mail className="h-4 w-4" />
            </a>
          </div>
        </section>
      </section>
    </main>
  )
}
