import { CircleDollarSign, HandHeart, HeartHandshake, Users } from 'lucide-react'

import { SupportMedia, GoldRule } from './SupportMedia'

const SUPPORT_CARDS = [
  {
    title: 'One-Time Donation',
    cta: 'Donate Today',
    href: '#donate',
    imageSrc: '/images/real/clw-wizards-youth-win.jpg',
    imageAlt: 'Crystal Lake Wizards youth wrestlers celebrating a win',
    imagePosition: 'center',
    Icon: CircleDollarSign,
  },
  {
    title: 'Monthly Booster',
    cta: 'Join the Boosters',
    href: '#boosters',
    imageSrc: '/images/real/clw-wizards-alumn-wisconsin.jpg',
    imageAlt: 'A Crystal Lake Wizards alumnus continuing in college wrestling',
    imagePosition: 'center',
    Icon: HandHeart,
  },
  {
    title: 'Corporate Sponsorship',
    cta: 'View Packages',
    href: '#sponsors',
    imageSrc: '/images/real/clw-wizards-gym-wall-sponsor.jpg',
    imageAlt: 'Sponsor recognition inside the Crystal Lake Wizards gym',
    imagePosition: 'center',
    Icon: HeartHandshake,
  },
  {
    title: 'Volunteer With Us',
    cta: 'Get Involved',
    href: '#contact',
    imageSrc: '/images/real/clw-wizards-family-photo.jpg',
    imageAlt: 'Crystal Lake Wizards families and wrestlers together',
    imagePosition: 'center',
    Icon: Users,
  },
]

export function SupportOverview() {
  return (
    <>
      <section className="bg-clw-black text-clw-black">
        <div className="grid lg:min-h-[640px] lg:grid-cols-[1.08fr_0.92fr]">
          <SupportMedia
            src="/images/real/team_march2025.jpg"
            alt="Crystal Lake Wizards team photo"
            className="h-72 w-full sm:h-[30rem] lg:h-full"
            position="center"
            dim="bg-clw-black/10"
          />

          <div className="flex bg-clw-white px-6 py-12 sm:px-10 sm:py-16 lg:items-center lg:px-14 xl:px-20">
            <div className="max-w-2xl text-left">
              <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Support the Club</p>
              <h1 className="mt-6 uppercase leading-[0.94] text-clw-black">
                <span className="block font-cond text-[clamp(3.4rem,7vw,5.6rem)] font-light">There are many ways</span>
                <span className="mt-2 block font-display text-[clamp(3.7rem,7.5vw,6.2rem)] font-black">You can get involved</span>
              </h1>
              <p className="mt-8 max-w-xl text-xl leading-relaxed text-clw-black/65 sm:text-2xl sm:leading-relaxed lg:text-xl">
                Crystal Lake Wizards Wrestling Club exists because of families, alumni, local businesses, and community partners who believe in building young athletes. Your support helps provide elite coaching, tournament opportunities, equipment, and scholarships for every wrestler who walks into our room.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-clw-white px-6 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2 lg:gap-5">
          {SUPPORT_CARDS.map(({ title, cta, href, imageSrc, imageAlt, imagePosition, Icon }) => (
            <a
              key={title}
              href={href}
              className="group relative isolate flex min-h-[220px] flex-col overflow-hidden border border-clw-gold/25 bg-clw-black-2/80 p-6 text-clw-white shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-clw-gold sm:min-h-[240px] lg:min-h-[230px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src={imageSrc}
                alt={imageAlt}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
                style={{ objectPosition: imagePosition }}
              />
              <div className="relative flex flex-1 flex-col items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clw-gold/12 text-clw-gold ring-1 ring-clw-gold/25">
                  <Icon className="h-7 w-7" strokeWidth={2.35} />
                </span>
                <h2 className="mt-7 font-display text-4xl uppercase leading-[0.98] text-clw-white sm:text-5xl lg:text-4xl xl:text-5xl">
                  {title}
                </h2>
                <span className="mt-auto pt-6 font-cond text-base uppercase tracking-[0.2em] text-clw-gold transition group-hover:text-clw-gold-l sm:text-lg lg:text-base">
                  {cta} →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24 xl:px-16 2xl:px-20">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_40%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Why we exist</p>
            <h2 className="mt-7 uppercase leading-[0.94] text-clw-white">
              <span className="block font-cond text-[clamp(3.4rem,6vw,5.4rem)] font-light">Building</span>
              <span className="block font-display text-[clamp(3.7rem,6.5vw,5.9rem)] font-black text-clw-gold">Champions for life</span>
            </h2>
            <GoldRule className="mt-8 max-w-40" />
          </div>

          <div className="space-y-7 text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed lg:text-xl">
            <p>Crystal Lake Wizards Wrestling Club was created to give wrestlers in our community a place to develop beyond the traditional season. Our focus has always been bigger than wins. We build confidence, discipline, leadership, and lifelong friendships through the sport of wrestling.</p>
            <p>Every practice, tournament, camp, and community event is made possible because families and supporters choose to invest in something bigger than a single season. Together we are creating opportunities for athletes of every age to compete, grow, and represent Crystal Lake with pride.</p>
            <p>Whether a wrestler dreams of competing in high school, college, or simply becoming more confident in everyday life, the Wizards are committed to providing an environment where hard work is rewarded and character comes first.</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 pb-20 sm:px-10 sm:pb-24 lg:px-12 lg:pb-28 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-7xl">
          <a href="#boosters" className="mx-auto block max-w-md border border-clw-gold bg-clw-black px-8 py-6 text-center font-display text-2xl uppercase tracking-wide text-clw-gold transition hover:bg-clw-gold hover:text-clw-black">Join the booster club</a>
          <div className="relative mx-auto mt-16 min-h-[520px] max-w-5xl lg:min-h-[620px]">
            <SupportMedia src="/images/real/clw-wizards-youth-team-photo-2.jpg" alt="Crystal Lake Wizards youth wrestling team" className="absolute right-0 top-0 h-52 w-[74%] sm:h-64 lg:h-80" position="center" dim="bg-clw-black/10" />
            <div className="absolute left-0 top-40 h-64 w-[72%] sm:top-52 sm:h-80 lg:top-60 lg:h-96"><SupportMedia src="/images/real/clw-wizards-coaches-action.jpg" alt="Crystal Lake Wizards coaches working with wrestlers" className="h-full w-full" position="center" dim="bg-clw-black/10" /></div>
            <div className="absolute bottom-0 right-0 flex h-56 w-56 rotate-[-13deg] items-center justify-center rounded-full border-[10px] border-clw-gold bg-clw-black/85 text-center font-display text-5xl uppercase leading-none text-clw-gold shadow-2xl sm:h-72 sm:w-72 lg:h-80 lg:w-80 lg:text-6xl">CLW</div>
          </div>
        </div>
      </section>
    </>
  )
}
