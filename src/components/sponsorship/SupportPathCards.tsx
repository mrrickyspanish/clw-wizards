import Link from 'next/link'
import { ArrowUpRight, CircleDollarSign, HandHeart, HeartHandshake, Users } from 'lucide-react'

import { SupportMedia } from './SupportMedia'

const SUPPORT_PATHS = [
  {
    title: 'One-Time Donation',
    description: 'Make a direct gift toward equipment, competition, athlete access, and the needs that keep the room moving.',
    cta: 'Explore one-time giving',
    href: '/sponsorship/donate',
    imageSrc: '/images/real/clw-wizards-youth-win.jpg',
    imageAlt: 'Wizards wrestlers celebrating together after competition',
    imagePosition: 'center',
    Icon: CircleDollarSign,
  },
  {
    title: 'Monthly Boosters',
    description: 'Create dependable month-to-month support for steady program growth, scholarships, and wrestler development.',
    cta: 'Join the boosters',
    href: '/sponsorship/boosters',
    imageSrc: '/images/real/clw-wizards-alumn-wisconsin.jpg',
    imageAlt: 'A Wizards alumnus continuing his wrestling journey',
    imagePosition: 'center',
    Icon: HandHeart,
  },
  {
    title: 'Corporate Sponsorship',
    description: 'Put your business behind local wrestlers while earning meaningful recognition across the Wizards community.',
    cta: 'Review sponsor options',
    href: '/sponsorship/sponsor',
    imageSrc: '/images/real/clw-wizards-gym-wall-sponsor.jpg',
    imageAlt: 'Sponsor recognition inside the Wizards wrestling room',
    imagePosition: 'center',
    Icon: HeartHandshake,
  },
  {
    title: 'Volunteer With Us',
    description: 'Help with coaching, tournaments, events, fundraising, communications, and the work that keeps the club strong.',
    cta: 'Find a way to help',
    href: '/sponsorship/volunteer',
    imageSrc: '/images/real/clw-wizards-family-photo.jpg',
    imageAlt: 'Wizards families and wrestlers together',
    imagePosition: 'center',
    Icon: Users,
  },
]

export function SupportPathCards() {
  return (
    <section className="bg-clw-black px-5 py-12 text-clw-white sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-cond text-sm font-semibold uppercase tracking-[0.3em] text-clw-gold">Choose Your Path</p>
          <h2 className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-white">How do you want to help?</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-relaxed text-clw-gray sm:text-xl">
            Each option has its own focused page with the details, impact, and next step you need.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
          {SUPPORT_PATHS.map(({ title, description, cta, href, imageSrc, imageAlt, imagePosition, Icon }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-[250px] flex-col overflow-hidden border border-clw-gold/30 bg-clw-black-2 transition duration-300 hover:-translate-y-1 hover:border-clw-gold sm:min-h-[330px]"
            >
              <div className="relative min-h-[125px] flex-1 overflow-hidden sm:min-h-[175px]">
                <SupportMedia src={imageSrc} alt={imageAlt} position={imagePosition} className="absolute inset-0" dim="bg-clw-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-clw-black-2 via-clw-black/20 to-transparent" />
                <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-clw-gold text-clw-black sm:left-5 sm:top-5 sm:h-11 sm:w-11">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.35} />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="font-display text-[1.55rem] uppercase leading-[0.92] tracking-wide text-clw-white sm:text-3xl">{title}</h3>
                <p className="mt-3 hidden text-base font-medium leading-relaxed text-clw-gray sm:block">{description}</p>
                <span className="mt-auto flex items-center gap-2 pt-4 font-cond text-xs font-semibold uppercase tracking-[0.12em] text-clw-gold sm:text-sm sm:tracking-[0.14em]">
                  {cta} <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
