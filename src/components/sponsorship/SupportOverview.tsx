import { CircleDollarSign, HandHeart, HeartHandshake, Users } from 'lucide-react'

import { SupportMedia, GoldRule } from './SupportMedia'

const SUPPORT_CARDS = [
  {
    title: 'ONE-TIME\nDONATION',
    cta: 'DONATE TODAY',
    href: '#donate',
    imageSrc: '/images/real/clw-wizards-youth-win.jpg',
    imageAlt: 'Crystal Lake Wizards youth wrestlers celebrating a win',
    imagePosition: 'center',
    Icon: CircleDollarSign,
  },
  {
    title: 'MONTHLY\nBOOSTER',
    cta: 'JOIN THE BOOSTERS',
    href: '#boosters',
    imageSrc: '/images/real/clw-wizards-alumn-wisconsin.jpg',
    imageAlt: 'A Crystal Lake Wizards alumnus continuing in college wrestling',
    imagePosition: 'center',
    Icon: HandHeart,
  },
  {
    title: 'CORPORATE\nSPONSORSHIP',
    cta: 'VIEW PACKAGES',
    href: '#sponsors',
    imageSrc: '/images/real/clw-wizards-gym-wall-sponsor.jpg',
    imageAlt: 'Sponsor recognition inside the Crystal Lake Wizards gym',
    imagePosition: 'center',
    Icon: HeartHandshake,
  },
  {
    title: 'VOLUNTEER\nWITH US',
    cta: 'GET INVOLVED',
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
      <section className="bg-clw-black text-clw-white">
        <div className="relative h-[360px] overflow-hidden sm:h-[420px] lg:h-[460px] xl:h-[500px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
          <img
            src="/images/real/team_march2025.jpg"
            alt="Crystal Lake Wizards team photo"
            className="absolute inset-0 h-full w-full object-cover object-center grayscale contrast-110 brightness-[0.62]"
          />
          <div className="absolute inset-0 bg-clw-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black/72 via-clw-black/10 to-clw-black/25" />
          <div className="absolute inset-0 flex items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-5xl text-center">
              <p className="font-cond text-sm font-semibold uppercase tracking-[0.32em] text-clw-gold sm:text-base">
                Ways to support the Wizards
              </p>
              <div className="mx-auto mt-5 h-2 w-full max-w-4xl bg-clw-gold" />
              <h1 className="my-3 font-impact text-[4.2rem] font-black uppercase leading-[0.86] tracking-normal text-clw-gold sm:text-[6rem] lg:text-[7.25rem] xl:text-[8rem]">
                Get Involved
              </h1>
              <div className="mx-auto h-2 w-full max-w-4xl bg-clw-gold" />
            </div>
          </div>
        </div>

        <div className="bg-clw-white px-6 py-8 text-center text-clw-black sm:px-8 sm:py-10">
          <p className="mx-auto max-w-4xl text-lg leading-relaxed text-clw-black/70 sm:text-xl">
            Crystal Lake Wizards Wrestling Club exists because of families, alumni, local businesses, and community partners who believe in building young athletes. Your support helps provide elite coaching, tournament opportunities, equipment, and scholarships for every wrestler who walks into our room.
          </p>
        </div>
      </section>

      <section className="bg-clw-white px-6 py-10 sm:px-8 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:gap-6">
          {SUPPORT_CARDS.map(({ title, cta, href, imageSrc, imageAlt, imagePosition, Icon }) => (
            <a
              key={title}
              href={href}
              className="group block overflow-hidden border border-clw-gold/80 bg-clw-black text-clw-white shadow-lg shadow-clw-black/10"
            >
              <div className="relative min-h-[210px] overflow-hidden sm:min-h-[220px] lg:min-h-[230px]">
                <SupportMedia src={imageSrc} alt={imageAlt} position={imagePosition} className="absolute inset-0" dim="bg-clw-black/10" />
                <div className="absolute inset-0 bg-clw-black/68" />
                <div className="absolute left-7 top-7">
                  <Icon className="h-11 w-11 text-clw-gold" strokeWidth={2.4} />
                </div>
                <div className="absolute inset-x-0 bottom-7 px-7 font-display text-[2.25rem] uppercase leading-[0.88] tracking-wide sm:text-[2.55rem]">
                  {title.split('\n').map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </div>
              </div>
              <div className="bg-clw-black px-6 py-4 text-center font-display text-xl uppercase tracking-wide transition group-hover:bg-clw-gold group-hover:text-clw-black sm:text-2xl">
                {cta}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 py-12 sm:px-10 sm:py-14 lg:py-16">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Why we exist</p>
          <h2 className="mt-6 max-w-3xl font-cond text-5xl uppercase leading-[0.88] tracking-wide text-clw-white sm:text-6xl lg:text-7xl">
            Building <span className="font-display text-clw-gold">champions for life</span>
          </h2>
          <GoldRule className="mt-7 max-w-40" />
          <div className="mt-8 grid gap-6 text-lg leading-relaxed text-clw-gray md:grid-cols-3 lg:text-xl">
            <p>Crystal Lake Wizards Wrestling Club was created to give wrestlers in our community a place to develop beyond the traditional season. Our focus has always been bigger than wins. We build confidence, discipline, leadership, and lifelong friendships through the sport of wrestling.</p>
            <p>Every practice, tournament, camp, and community event is made possible because families and supporters choose to invest in something bigger than a single season. Together we are creating opportunities for athletes of every age to compete, grow, and represent Crystal Lake with pride.</p>
            <p>Whether a wrestler dreams of competing in high school, college, or simply becoming more confident in everyday life, the Wizards are committed to providing an environment where hard work is rewarded and character comes first.</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 pb-14 sm:px-10 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <a href="#boosters" className="block border border-clw-gold bg-clw-black px-8 py-5 text-center font-display text-xl uppercase tracking-wide text-clw-gold transition hover:bg-clw-gold hover:text-clw-black sm:text-2xl">
            Join the booster club
          </a>
          <div className="relative mt-10 min-h-[380px] sm:min-h-[430px]">
            <SupportMedia src="/images/real/clw-wizards-youth-team-photo-2.jpg" alt="Crystal Lake Wizards youth wrestling team" className="absolute right-0 top-0 h-40 w-[72%] sm:h-48" position="center" dim="bg-clw-black/10" />
            <div className="absolute left-0 top-28 h-56 w-[70%] sm:top-36 sm:h-64">
              <SupportMedia src="/images/real/clw-wizards-coaches-action.jpg" alt="Crystal Lake Wizards coaches working with wrestlers" className="h-full w-full" position="center" dim="bg-clw-black/10" />
            </div>
            <div className="absolute bottom-0 right-0 flex h-44 w-44 rotate-[-13deg] items-center justify-center rounded-full border-[8px] border-clw-gold bg-clw-black/85 text-center font-display text-4xl uppercase leading-none text-clw-gold shadow-2xl sm:h-56 sm:w-56 sm:text-5xl">
              CLW
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
