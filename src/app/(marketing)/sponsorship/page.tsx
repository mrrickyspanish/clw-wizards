import type { Metadata } from 'next'
import {
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  HandHeart,
  HeartHandshake,
  Mail,
  MapPin,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import type { Sponsor } from '@/types/database'
import { SponsorsShowcase } from '@/components/landing/SponsorsShowcase'

const SUPPORT_CARDS = [
  {
    title: 'ONE-TIME\nDONATION',
    cta: 'DONATE TODAY',
    imageLabel: 'PLACEHOLDER IMAGE · Team practice wide hero',
    Icon: CircleDollarSign,
  },
  {
    title: 'MONTHLY\nBOOSTER',
    cta: 'JOIN THE BOOSTERS',
    imageLabel: 'PLACEHOLDER IMAGE · Kids celebrating after tournament',
    Icon: HandHeart,
  },
  {
    title: 'CORPORATE\nSPONSORSHIP',
    cta: 'VIEW PACKAGES',
    imageLabel: 'PLACEHOLDER IMAGE · Coach shaking sponsor hand',
    Icon: HeartHandshake,
  },
  {
    title: 'VOLUNTEER\nWITH US',
    cta: 'GET INVOLVED',
    imageLabel: 'PLACEHOLDER IMAGE · Parents cheering in stands',
    Icon: Users,
  },
]

const BOOSTER_LEVELS = [
  {
    name: 'Supporter',
    amount: '$10 / Month',
    body: 'Perfect for alumni, friends, and community members who simply want to help young wrestlers succeed. This level keeps the club moving and gives families a simple way to support the room all season long.',
  },
  {
    name: 'Bronze Wizard',
    amount: '$25 / Month',
    body: 'Helps provide practice equipment, cleaning supplies, training tools, and athlete scholarships throughout the season. Small monthly support adds up when the whole wrestling community gets behind the mission.',
  },
  {
    name: 'Silver Wizard',
    amount: '$50 / Month',
    body: 'Supports tournament entry fees, travel assistance, clinician visits, and expanded training opportunities for developing athletes. This level helps our wrestlers get more mat time and stronger competition.',
  },
  {
    name: 'Gold Wizard',
    amount: '$100 / Month',
    body: 'Allows the club to invest in upgraded equipment, wrestling technology, camps, and athlete development throughout the year. This level helps us build a better room for serious wrestlers and growing families.',
  },
  {
    name: 'Champion Circle',
    amount: '$250 / Month',
    body: 'Provides transformational support that helps fund scholarships, major equipment purchases, facility improvements, and long-term growth of the Crystal Lake Wizards Wrestling Club. This is how a local club becomes a lasting program.',
  },
]

const SPONSOR_TIERS = [
  { name: 'White Sponsor', amount: '$150', body: 'Entry-level business support with club recognition and a direct connection to the Crystal Lake wrestling community.' },
  { name: 'Black Sponsor', amount: '$250', body: 'Includes recognition on the Wizards website and promotional support during the season.' },
  { name: 'Gold Sponsor', amount: '$500', body: 'Adds stronger visibility through digital placement, social recognition, and club event opportunities.' },
  { name: 'Platinum Sponsor', amount: '$1,000', body: 'Premium partner support with elevated placement, event visibility, and season-long community recognition.' },
]

const FAQS = [
  ['Where does my donation go?', 'Donations support equipment, tournament costs, coaching resources, scholarships, travel support, facility needs, and the day-to-day expenses that keep the club strong for every wrestler.'],
  ['Is my donation tax deductible?', 'Crystal Lake Wizards Wrestling Club is a nonprofit program. Please confirm tax details with the club and your tax professional before filing.'],
  ['Can I sponsor a specific wrestler?', 'Reach out to the club and we can talk through the best way to support athlete needs while keeping scholarship and assistance decisions fair for families.'],
  ['Do you accept corporate sponsors?', 'Yes. Local business sponsors can support the club through annual packages, event sponsorship, signage, website placement, and social media recognition.'],
  ['How do I volunteer?', 'Send us a message and tell us how you want to help. We need support at events, tournaments, fundraising efforts, communications, and club operations.'],
]

export const metadata: Metadata = {
  title: 'Sponsorship',
  description: 'Donation, booster, sponsorship, and volunteer opportunities for Crystal Lake Wizards Wrestling Club.',
}

function PlaceholderImage({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-clw-black-3 ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_42%,rgba(240,192,32,0.16))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(240,192,32,0.18),transparent_30%)]" />
      <div className="absolute inset-0 flex items-center justify-center px-8 text-center font-cond text-xs uppercase tracking-[0.22em] text-clw-white/45">
        {label}
      </div>
    </div>
  )
}

function TornEdge({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`h-10 bg-clw-black ${flip ? 'rotate-180' : ''}`}
      style={{ clipPath: 'polygon(0 0, 7% 22%, 15% 9%, 25% 31%, 35% 14%, 48% 27%, 58% 10%, 70% 25%, 82% 8%, 92% 20%, 100% 0, 100% 100%, 0 100%)' }}
    />
  )
}

export default async function SponsorshipPage() {
  const supabase = await createServerSupabase()
  const { data: sponsors } = await supabase.from('sponsors').select('*').eq('active', true)
  const sponsorRows = (sponsors ?? []) as Sponsor[]

  return (
    <main className="bg-clw-black text-clw-white">
      <section className="bg-clw-white px-6 pb-12 pt-16 text-center text-clw-black sm:px-8">
        <p className="mx-auto max-w-[21rem] font-cond text-5xl uppercase leading-[0.9] tracking-wide sm:max-w-xl sm:text-7xl">
          There are many ways <span className="font-display font-black">you can get involved</span>
        </p>
        <p className="mx-auto mt-8 max-w-[33rem] text-xl leading-relaxed text-clw-black/60">
          Crystal Lake Wizards Wrestling Club exists because of families, alumni, local businesses, and community partners who believe in building young athletes. Your support helps provide elite coaching, tournament opportunities, equipment, and scholarships for every wrestler who walks into our room.
        </p>
      </section>

      <section className="bg-clw-white px-6 pb-16 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          {SUPPORT_CARDS.map(({ title, cta, imageLabel, Icon }) => (
            <a key={title} href={`mailto:${ORG.contactEmail}?subject=${encodeURIComponent(title.replace('\n', ' '))}`} className="group block border border-clw-gold bg-clw-black text-clw-white">
              <div className="relative min-h-[315px] overflow-hidden">
                <PlaceholderImage label={imageLabel} className="absolute inset-0" />
                <div className="absolute inset-0 bg-clw-black/70" />
                <div className="absolute inset-x-0 top-16 flex justify-center">
                  <Icon className="h-16 w-16 text-clw-gold" strokeWidth={2.4} />
                </div>
                <div className="absolute inset-x-0 bottom-16 px-8 text-center font-display text-5xl uppercase leading-[0.9] tracking-wide">
                  {title.split('\n').map((line) => <span key={line} className="block">{line}</span>)}
                </div>
              </div>
              <div className="bg-clw-black px-6 py-8 text-center font-display text-2xl uppercase tracking-wide transition group-hover:bg-clw-gold group-hover:text-clw-black">
                {cta}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 py-16 sm:px-10">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-white">Why we exist</p>
          <h2 className="mt-8 font-cond text-6xl uppercase leading-[0.88] tracking-wide text-clw-white sm:text-7xl">
            Building <span className="font-display text-clw-gold">champions for life</span>
          </h2>
          <div className="mt-8 space-y-8 text-xl leading-relaxed text-clw-gray">
            <p>Crystal Lake Wizards Wrestling Club was created to give wrestlers in our community a place to develop beyond the traditional season. Our focus has always been bigger than wins. We build confidence, discipline, leadership, and lifelong friendships through the sport of wrestling.</p>
            <p>Every practice, tournament, camp, and community event is made possible because families and supporters choose to invest in something bigger than a single season. Together we are creating opportunities for athletes of every age to compete, grow, and represent Crystal Lake with pride.</p>
            <p>Whether a wrestler dreams of competing in high school, college, or simply becoming more confident in everyday life, the Wizards are committed to providing an environment where hard work is rewarded and character comes first.</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 pb-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <a href={`mailto:${ORG.contactEmail}?subject=Booster%20Club`} className="block bg-clw-gold px-8 py-6 text-center font-display text-2xl uppercase tracking-wide text-clw-black">Join the booster club</a>
          <div className="relative mt-16 min-h-[520px]">
            <PlaceholderImage label="PLACEHOLDER IMAGE · Historic team photo" className="absolute right-0 top-0 h-48 w-[74%]" />
            <div className="absolute left-0 top-40 h-64 w-[72%]"><PlaceholderImage label="PLACEHOLDER IMAGE · Youth wrestler drilling" className="h-full w-full" /></div>
            <div className="absolute bottom-0 right-0 flex h-56 w-56 rotate-[-13deg] items-center justify-center rounded-full border-[10px] border-clw-gold text-center font-display text-5xl uppercase leading-none text-clw-gold sm:h-72 sm:w-72">
              CLW
            </div>
          </div>
        </div>
      </section>

      <TornEdge />
      <section className="bg-clw-white px-7 py-16 text-center text-clw-black sm:px-10">
        <div className="mx-auto max-w-3xl">
          <PlaceholderImage label="PLACEHOLDER IMAGE · Coach instructing athlete" className="mx-auto h-72 w-full max-w-lg" />
          <div className="mx-auto mt-12 h-4 w-36 bg-clw-gold" />
          <h2 className="mt-12 font-cond text-6xl uppercase leading-[0.9] tracking-wide sm:text-7xl">
            Make a one time <span className="block font-display font-black">donation</span>
          </h2>
          <p className="mx-auto mt-8 max-w-[34rem] text-xl leading-relaxed text-clw-black/70">
            Every dollar goes directly toward helping our athletes succeed. Donations help cover tournament fees, practice equipment, scholarships, travel assistance, facility improvements, and the resources needed to keep wrestling affordable for every family.
          </p>
          <a href={`mailto:${ORG.contactEmail}?subject=One-Time%20Donation`} className="mt-10 inline-block bg-clw-gold px-16 py-6 font-display text-2xl uppercase tracking-wide text-clw-black">Donate</a>
          <PlaceholderImage label="PLACEHOLDER IMAGE · Championship medal ceremony" className="mt-16 h-80 w-full" />
        </div>
      </section>

      <TornEdge flip />
      <section className="relative overflow-hidden bg-clw-black px-7 py-20 text-center sm:px-10">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(240,192,32,.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_44%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 rounded-full border border-clw-gold/45 sm:h-[30rem] sm:w-[30rem]" />
          <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full border border-clw-gold/35 sm:h-96 sm:w-96" />
          <h2 className="relative font-cond text-6xl uppercase leading-[0.9] tracking-wide text-clw-white sm:text-7xl">
            Join the CLW <span className="block font-display text-clw-gold">Booster Club</span>
          </h2>
          <p className="relative mx-auto mt-10 max-w-[30rem] text-xl leading-relaxed text-clw-gray">
            Become part of the team behind the team. Monthly supporters provide dependable funding that allows us to plan for new equipment, athlete development, coaching resources, and scholarships throughout the year.
          </p>
          <a href={`mailto:${ORG.contactEmail}?subject=Booster%20Club`} className="relative mt-10 inline-block bg-clw-gold px-16 py-6 font-display text-2xl uppercase tracking-wide text-clw-black">Join Now</a>
        </div>
      </section>

      <section className="bg-clw-black px-7 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-center font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Monthly & Annual Donations</p>
          <div className="mt-10 space-y-12">
            {BOOSTER_LEVELS.map((level) => (
              <div key={level.name}>
                <h3 className="text-3xl font-bold text-clw-white">{level.name}</h3>
                <p className="mt-3 font-cond text-2xl tracking-[0.18em] text-clw-gold">{level.amount}</p>
                <p className="mt-6 text-xl leading-relaxed text-clw-gray">{level.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-clw-black px-7 pb-16 sm:px-10">
        <div className="mx-auto max-w-3xl border-t border-clw-gold/20 pt-14">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Business Support</p>
          <h2 className="mt-6 font-display text-5xl uppercase leading-none text-clw-white sm:text-6xl">Corporate Sponsorship</h2>
          <p className="mt-8 text-xl leading-relaxed text-clw-gray">
            Local business sponsors help keep the Wizards affordable, competitive, and visible in the community. Sponsorship can include gym signage, website recognition, social media features, tournament support, event visibility, and direct goodwill with wrestling families across Crystal Lake.
          </p>
          <div className="mt-10 space-y-6">
            {SPONSOR_TIERS.map((tier) => (
              <div key={tier.name} className="border border-clw-gold/20 bg-clw-black-2 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-display text-3xl uppercase text-clw-white">{tier.name}</h3>
                    <p className="mt-3 text-lg leading-relaxed text-clw-gray">{tier.body}</p>
                  </div>
                  <p className="font-cond text-2xl tracking-wide text-clw-gold">{tier.amount}</p>
                </div>
              </div>
            ))}
          </div>
          <a href={`mailto:${ORG.contactEmail}?subject=Corporate%20Sponsorship`} className="mt-10 block bg-clw-gold px-8 py-6 text-center font-display text-xl uppercase tracking-wide text-clw-black">Download Sponsorship Guide</a>
        </div>
      </section>

      <section className="bg-clw-white px-7 py-16 text-clw-black sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <PlaceholderImage label="PLACEHOLDER IMAGE · Parents and volunteers at event table" className="h-72 w-full" />
          <h2 className="mt-12 font-display text-5xl uppercase leading-none sm:text-6xl">Volunteer With Us</h2>
          <p className="mx-auto mt-8 max-w-[34rem] text-xl leading-relaxed text-clw-black/70">
            The Wizards are powered by people who show up. Volunteers help with tournaments, fundraising, communications, setup, photography, team meals, and the small details that make a wrestling club feel like a real community.
          </p>
          <a href={`mailto:${ORG.contactEmail}?subject=Volunteer%20With%20CLW`} className="mt-10 inline-block bg-clw-gold px-14 py-6 font-display text-xl uppercase tracking-wide text-clw-black">Become a Volunteer</a>
        </div>
      </section>

      <section className="bg-clw-black px-7 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-5xl uppercase leading-none text-clw-white">Questions</h2>
          <div className="mt-8 divide-y divide-clw-gold/20 border-y border-clw-gold/20">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl uppercase text-clw-white marker:hidden">
                  {question}
                </summary>
                <p className="mt-4 text-lg leading-relaxed text-clw-gray">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <TornEdge />
      <section className="bg-clw-white px-7 py-16 text-clw-black sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em]">Talk with the Crystal Lake Wizards</p>
          <h2 className="mt-8 font-display text-6xl uppercase leading-none sm:text-7xl">Get in touch</h2>
          <p className="mt-8 text-2xl leading-relaxed text-clw-black/75">
            If you are ready to support the club, sponsor the season, volunteer your time, or ask a few questions first, email or message Crystal Lake Wizards Wrestling Club and start the conversation today.
          </p>
          <div className="mt-10 space-y-8 text-xl">
            <div>
              <p className="mb-4 flex items-center gap-3 font-cond uppercase tracking-[0.25em]"><MapPin className="h-5 w-5" />Mail Us</p>
              <p>{ORG.mailingAddress}</p>
            </div>
            <div className="border-t border-clw-black/30 pt-8">
              <p className="mb-4 flex items-center gap-3 font-cond uppercase tracking-[0.25em]"><Mail className="h-5 w-5" />Send an Email</p>
              <a href={`mailto:${ORG.contactEmail}`} className="underline decoration-clw-gold decoration-4 underline-offset-4">{ORG.contactEmail}</a>
            </div>
          </div>
          <form className="mt-14 space-y-6">
            {['First Name', 'Last Name', 'Email', 'Message'].map((field) => (
              <input key={field} placeholder={field} className="w-full border border-clw-black/25 bg-clw-white px-6 py-5 text-xl text-clw-black placeholder:text-clw-black/35" />
            ))}
            <button type="button" className="w-full bg-clw-gold px-8 py-6 font-display text-2xl uppercase tracking-wide text-clw-black">Submit Inquiry</button>
          </form>
        </div>
      </section>

      {sponsorRows.length > 0 && (
        <section className="bg-clw-black px-7 py-14 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mb-6 text-center font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Current Sponsors</p>
            <SponsorsShowcase sponsors={sponsorRows} />
          </div>
        </section>
      )}

      <div className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 overflow-hidden rounded-full border border-clw-gold/30 bg-clw-black/90 text-center text-xs font-display uppercase tracking-wide text-clw-white shadow-2xl backdrop-blur md:hidden">
        <a href={`mailto:${ORG.contactEmail}?subject=Donation`} className="py-4 text-clw-gold">Donate</a>
        <a href={`mailto:${ORG.contactEmail}?subject=Sponsorship`} className="border-x border-clw-gold/20 py-4">Sponsor</a>
        <a href={`mailto:${ORG.contactEmail}?subject=Booster%20Club`} className="py-4">Boosters</a>
      </div>
    </main>
  )
}
