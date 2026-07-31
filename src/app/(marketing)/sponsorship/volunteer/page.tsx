import type { Metadata } from 'next'

import { pageMetadata } from '@/lib/page-metadata'
import Link from 'next/link'
import { ArrowUpRight, Camera, ClipboardList, Megaphone, ShieldCheck, Trophy, Users } from 'lucide-react'

import { ContactForm } from '@/components/sponsorship/ContactForm'
import { SupportPageHero } from '@/components/sponsorship/SupportPageHero'

const VOLUNTEER_PATHS = [
  {
    title: 'Tournament Support',
    description: 'Help with setup, check-in, hospitality, concessions, team coordination, and the details that keep competition days organized.',
    Icon: Trophy,
  },
  {
    title: 'Fundraising & Events',
    description: 'Support golf outings, raffles, banquets, sponsor activation, community events, and other club fundraising efforts.',
    Icon: ClipboardList,
  },
  {
    title: 'Communications',
    description: 'Lend a hand with photography, video, social media, design, storytelling, and keeping families informed.',
    Icon: Camera,
  },
  {
    title: 'Room Operations',
    description: 'Assist with facility projects, cleaning, equipment, team meals, transportation coordination, and practical club needs.',
    Icon: Users,
  },
  {
    title: 'Coaching Pathway',
    description: 'Experienced wrestlers and coaches can ask about joining the staff. Required certifications and club approval apply.',
    Icon: ShieldCheck,
  },
  {
    title: 'Community Outreach',
    description: 'Help the Wizards connect with schools, local businesses, alumni, prospective families, and community partners.',
    Icon: Megaphone,
  },
]

export const metadata: Metadata = pageMetadata({
  title: 'Volunteer With Us',
  description: 'Volunteer with Wizards Wrestling Club through tournaments, events, coaching, communications, fundraising, and club operations.',
})

export default function VolunteerPage() {
  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <SupportPageHero
        eyebrow="Give your time and talent"
        title="Volunteer With Us"
        description="The Wizards are powered by people who show up. Volunteers help create better events, stronger communication, a more dependable wrestling room, and a real sense of community for every family in the program."
        imageSrc="/images/real/clw-wizards-family-photo.jpg"
        imageAlt="Wizards families and wrestlers together"
        imagePosition="center"
      />

      <section className="bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Ways to Help</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-white">There is a place for your strengths.</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-clw-gray sm:text-xl">
              You do not need wrestling experience to make a difference. Tell us what you enjoy, what you know, and how much time you can give.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-3">
            {VOLUNTEER_PATHS.map(({ title, description, Icon }) => (
              <article key={title} className="min-h-[190px] border border-clw-gold/25 bg-clw-black-2 p-4 sm:min-h-[250px] sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clw-gold text-clw-black sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 font-display text-2xl uppercase leading-none text-clw-white sm:text-3xl">{title}</h3>
                <p className="mt-3 hidden text-base font-medium leading-relaxed text-clw-gray sm:block">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section-light scroll-mt-32 bg-[#F7F4EA] px-5 py-12 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold-on-light">Volunteer Interest</p>
            <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-ink">Tell us how you want to help.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-clw-muted-dark sm:text-xl">
              Share your interests, experience, and availability. A club leader will follow up about the best fit and any requirements.
            </p>
          </div>

          <ContactForm defaultTopic="Volunteer" hideTopic submitLabel="Submit Volunteer Interest" />

          <div className="mt-8 text-center">
            <Link href="/sponsorship" className="inline-flex items-center gap-2 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-clw-gold-on-light hover:text-clw-ink">
              View every way to support <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
