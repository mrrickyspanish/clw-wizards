import { CircleDollarSign, HandHeart, HeartHandshake, Users } from 'lucide-react'

import { SupportMedia, GoldRule } from './SupportMedia'

const SUPPORT_CARDS = [
  {
    title: 'ONE-TIME\nDONATION',
    cta: 'DONATE TODAY',
    href: '#donate',
    imageSrc: '/images/real/team_march2025.jpg',
    imageAlt: 'Crystal Lake Wizards team photo',
    imagePosition: 'center',
    Icon: CircleDollarSign,
  },
  {
    title: 'MONTHLY\nBOOSTER',
    cta: 'JOIN THE BOOSTERS',
    href: '#boosters',
    imageSrc: '/images/real/facility_pano.jpg',
    imageAlt: 'Crystal Lake Wizards practice facility',
    imagePosition: 'center',
    Icon: HandHeart,
  },
  {
    title: 'CORPORATE\nSPONSORSHIP',
    cta: 'VIEW PACKAGES',
    href: '#sponsors',
    imageSrc: '/images/real/coaches_trophy.jpg',
    imageAlt: 'Crystal Lake Wizards coaches with trophy',
    imagePosition: 'center',
    Icon: HeartHandshake,
  },
  {
    title: 'VOLUNTEER\nWITH US',
    cta: 'GET INVOLVED',
    href: '#contact',
    imageSrc: '/images/real/team_march2025.jpg',
    imageAlt: 'Crystal Lake Wizards wrestling team',
    imagePosition: 'center top',
    Icon: Users,
  },
]

export function SupportOverview() {
  return (
    <>
      <section className="bg-clw-black pt-20 text-center text-clw-black md:pt-24">
        <SupportMedia src="/images/real/team_march2025.jpg" alt="Crystal Lake Wizards team photo" className="h-72 w-full sm:h-[30rem]" position="center" dim="bg-clw-black/10" />
        <div className="bg-clw-white px-6 pb-12 pt-12 sm:px-8 sm:pb-16">
          <p className="mx-auto max-w-[21rem] font-cond text-5xl uppercase leading-[0.9] tracking-wide sm:max-w-xl sm:text-7xl">
            There are many ways <span className="font-display font-black">you can get involved</span>
          </p>
          <p className="mx-auto mt-8 max-w-[33rem] text-xl leading-relaxed text-clw-black/60">
            Crystal Lake Wizards Wrestling Club exists because of families, alumni, local businesses, and community partners who believe in building young athletes. Your support helps provide elite coaching, tournament opportunities, equipment, and scholarships for every wrestler who walks into our room.
          </p>
        </div>
      </section>

      <section className="bg-clw-white px-6 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-7">
          {SUPPORT_CARDS.map(({ title, cta, href, imageSrc, imageAlt, imagePosition, Icon }) => (
            <a key={title} href={href} className="group block border border-clw-gold/80 bg-clw-black text-clw-white shadow-xl shadow-clw-black/10">
              <div className="relative min-h-[250px] overflow-hidden">
                <SupportMedia src={imageSrc} alt={imageAlt} position={imagePosition} className="absolute inset-0" dim="bg-clw-black/10" />
                <div className="absolute inset-0 bg-clw-black/72" />
                <div className="absolute inset-x-0 top-10 flex justify-center">
                  <Icon className="h-14 w-14 text-clw-gold" strokeWidth={2.4} />
                </div>
                <div className="absolute inset-x-0 bottom-10 px-8 text-center font-display text-[2.7rem] uppercase leading-[0.9] tracking-wide sm:text-5xl">
                  {title.split('\n').map((line) => <span key={line} className="block">{line}</span>)}
                </div>
              </div>
              <div className="bg-clw-black px-6 py-6 text-center font-display text-2xl uppercase tracking-wide transition group-hover:bg-clw-gold group-hover:text-clw-black">{cta}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 py-16 sm:px-10 sm:py-20">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold">Why we exist</p>
          <h2 className="mt-8 font-cond text-6xl uppercase leading-[0.88] tracking-wide text-clw-white sm:text-7xl">
            Building <span className="font-display text-clw-gold">champions for life</span>
          </h2>
          <GoldRule className="mt-8 max-w-40" />
          <div className="mt-8 space-y-8 text-xl leading-relaxed text-clw-gray">
            <p>Crystal Lake Wizards Wrestling Club was created to give wrestlers in our community a place to develop beyond the traditional season. Our focus has always been bigger than wins. We build confidence, discipline, leadership, and lifelong friendships through the sport of wrestling.</p>
            <p>Every practice, tournament, camp, and community event is made possible because families and supporters choose to invest in something bigger than a single season. Together we are creating opportunities for athletes of every age to compete, grow, and represent Crystal Lake with pride.</p>
            <p>Whether a wrestler dreams of competing in high school, college, or simply becoming more confident in everyday life, the Wizards are committed to providing an environment where hard work is rewarded and character comes first.</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-clw-black px-7 pb-20 sm:px-10 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <a href="#boosters" className="block border border-clw-gold bg-clw-black px-8 py-6 text-center font-display text-2xl uppercase tracking-wide text-clw-gold transition hover:bg-clw-gold hover:text-clw-black">Join the booster club</a>
          <div className="relative mt-16 min-h-[520px]">
            <SupportMedia src="/images/real/team_march2025.jpg" alt="Crystal Lake Wizards team photo" className="absolute right-0 top-0 h-48 w-[74%]" position="center top" dim="bg-clw-black/10" />
            <div className="absolute left-0 top-40 h-64 w-[72%]"><SupportMedia src="/images/real/coaches_trophy.jpg" alt="Crystal Lake Wizards coaches with trophy" className="h-full w-full" position="center" dim="bg-clw-black/10" /></div>
            <div className="absolute bottom-0 right-0 flex h-56 w-56 rotate-[-13deg] items-center justify-center rounded-full border-[10px] border-clw-gold bg-clw-black/85 text-center font-display text-5xl uppercase leading-none text-clw-gold shadow-2xl sm:h-72 sm:w-72">CLW</div>
          </div>
        </div>
      </section>
    </>
  )
}
