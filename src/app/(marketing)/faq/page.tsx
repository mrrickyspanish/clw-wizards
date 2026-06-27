import type { Metadata } from 'next'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'How do I register, and what does it cost?',
    a: 'Registration includes a mandatory fundraiser: each wrestler sells 20 raffle tickets at $5 each ($100 total), so it costs your family $0, or you can buy out the books for a $50 credit toward tournaments. Separately, every family must purchase a USA Wrestling card online at usawmembership.com for $45 per wrestler. The card is required before practices begin in November, and new families should select "CL Wizards" as their club in the dropdown.',
  },
  {
    q: 'What do I need to bring to practice?',
    a: 'Shorts and a t-shirt (no hoods, snaps, or zippers), a water bottle, headgear, and wrestling shoes. Please keep outside shoes off the mats.',
  },
  {
    q: 'How are practice groups organized?',
    a: 'We run four practice groups, and we place wrestlers where they will have the most success. Kids may move groups if they are not being challenged. Because the facility is capped at 50 people, the practice room is closed to parents for groups 2-4. Group 1 parents may stay and watch for the first two weeks.',
  },
  {
    q: 'Do I need a singlet?',
    a: 'Singlets are only worn at tournaments when representing the Crystal Lake Wizards. A $75 deposit check gets you one.',
  },
  {
    q: 'What do tournaments cost, and are they mandatory?',
    a: 'Tournaments are voluntary. We typically attend one or two each weekend starting the first week of December. Tournament fees ($15-20 per event) are separate from registration and paid per event.',
  },
  {
    q: 'What are the IKWF age divisions?',
    a: 'Tots (4-6), Bantam (7-8), Midget (9-10), Novice (11-12), and Senior (13-14).',
  },
  {
    q: 'Can I coach or watch practice?',
    a: 'Coaching, or simply being in the practice room, requires a USA Wrestling coach’s card. Coaches 18 and older must pass a background screening every other season. This protects the club, the wrestlers, and the coaches.',
  },
  {
    q: 'Where do I park?',
    a: 'Our facility is at 975 Nimco Dr, Unit L, Crystal Lake. Spots along the building are limited, with more to the west. Please do not park in front of the garage door.',
  },
]

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about registration, practice, equipment, tournaments, and coaching.',
}

export default function FaqPage() {
  return (
    <main className="mission-frame py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Crystal Lake, Illinois</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-clw-white sm:text-6xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-clw-gray">Registration, equipment, practice, and tournaments, all in one place.</p>
      </header>

      <div className="chamfer-md card-depth mt-8 border border-clw-gold/10 bg-clw-black-2 p-6 lg:p-8">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="border-clw-gold/10">
              <AccordionTrigger className="text-left text-clw-white hover:no-underline hover:text-clw-gold">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-clw-gray">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  )
}
