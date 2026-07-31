import Link from 'next/link'
import { CircleDollarSign, HandHeart, HeartHandshake, Users } from 'lucide-react'
import { CTA_LINK } from '@/lib/cta'

const SUPPORT_PHOTOS = [
  '/images/real/clw-wizards-youth-win.jpg',
  '/images/real/clw-wizards-gym-wall-sponsor.jpg',
  '/images/real/clw-wizards-alumn-wisconsin.jpg',
  '/images/real/clw-wizards-youth-banquet-tony.jpg',
]

const SUPPORT_OPTIONS = [
  {
    title: 'Donate',
    body: 'Help cover equipment, tournament costs, scholarships, and the day-to-day needs that keep the room strong.',
    href: '/sponsorship/donate',
    cta: 'Donate today',
    Icon: CircleDollarSign,
  },
  {
    title: 'Sponsor',
    body: 'Back McHenry County wrestlers and put your business in front of the club community, including families, alumni, and fans.',
    href: '/sponsorship/sponsor',
    cta: 'See sponsor options',
    Icon: HeartHandshake,
  },
  {
    title: 'Boosters',
    body: 'Join the families, alumni, and supporters who help fund steady growth throughout the season.',
    href: '/sponsorship/boosters',
    cta: 'Join the boosters',
    Icon: HandHeart,
  },
  {
    title: 'Volunteer',
    body: 'Commit to coaching, certification required, or lend a hand with tournaments, fundraising, setup, and the details that keep the room running.',
    href: '/sponsorship/volunteer',
    cta: 'Get involved',
    Icon: Users,
  },
]

export function HomeSupportIntro() {
  return (
    <section className="relative overflow-hidden border-b border-clw-gold/30 bg-clw-black px-5 pb-16 pt-10 text-clw-white sm:px-8 sm:pb-20 sm:pt-12 lg:px-12 lg:pb-24 lg:pt-14 xl:px-16 2xl:px-20 2xl:pb-32 2xl:pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_80%_5%,rgba(240,192,32,.2),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.08),transparent_44%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-2 select-none font-display text-[9rem] leading-none text-clw-gold/[0.055] sm:text-[12rem] lg:text-[15rem] 2xl:text-[18rem]"
      >
        W
      </span>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-1 lg:text-center">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Support</p>
            <h2 className="mt-3 max-w-3xl uppercase leading-[0.92] text-clw-white lg:mx-auto lg:max-w-none">
              <span className="block font-cond text-[clamp(2.5rem,10.5vw,5rem)] font-light tracking-[-0.04em] lg:text-[3.75rem] xl:text-[4.2rem] 2xl:text-[5rem]">
                Many ways to help.
              </span>
              <span className="block font-display text-[clamp(2.75rem,11.5vw,5.6rem)] font-black tracking-[-0.035em] text-clw-gold lg:text-[4rem] xl:text-[4.55rem] 2xl:text-[5.6rem]">
                One room to build.
              </span>
            </h2>
          </div>

          <div className="max-w-2xl text-lg leading-[1.6] text-white/85 sm:text-xl sm:leading-relaxed lg:mx-auto lg:max-w-3xl lg:text-lg lg:leading-[1.65]">
            <p>
              Wizards Wrestling Club exists because families, alumni, local businesses, and community partners like you choose to invest in young wrestlers.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3 lg:grid-cols-2 lg:gap-4 min-[1180px]:grid-cols-4 2xl:mt-9 2xl:gap-5">
          {SUPPORT_OPTIONS.map(({ title, body, href, cta, Icon }, index) => (
            <Link
              key={title}
              href={href}
              className="group relative isolate flex min-h-[165px] flex-col overflow-hidden border border-clw-gold/25 bg-clw-black-2/80 p-4 text-clw-white shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-clw-gold sm:min-h-[210px] sm:p-5 lg:min-h-[205px] min-[1180px]:min-h-[230px] 2xl:min-h-[250px] 2xl:p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
              <img
                src={SUPPORT_PHOTOS[index % SUPPORT_PHOTOS.length]}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
              />
              <div className="relative flex flex-1 flex-col items-center text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clw-gold/12 text-clw-gold ring-1 ring-clw-gold/25 sm:h-11 sm:w-11 2xl:h-12 2xl:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 2xl:h-7 2xl:w-7" strokeWidth={2.35} />
                </span>
                <h3 className="mt-3 font-display text-[1.8rem] uppercase leading-none tracking-wide text-clw-white sm:mt-5 sm:text-4xl lg:text-4xl min-[1180px]:text-3xl xl:text-4xl 2xl:mt-7 2xl:text-5xl">
                  {title}
                </h3>
                <p className="mx-auto mt-3 hidden max-w-xs text-base font-medium leading-relaxed text-white/85 sm:block min-[1180px]:text-[0.92rem] 2xl:mt-4 2xl:text-base">
                  {body}
                </p>
                <span className="mt-auto pt-3 font-cond text-sm uppercase tracking-[0.12em] text-clw-gold transition group-hover:text-clw-gold-l sm:pt-4 sm:text-base sm:tracking-[0.16em] 2xl:pt-6 2xl:text-lg">
                  {cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex justify-start border-t border-clw-gold/25 pt-5 sm:mt-6 sm:pt-6 lg:justify-center 2xl:mt-8 2xl:pt-7">
          <Link href="/sponsorship" className={`${CTA_LINK} text-clw-gold hover:text-clw-gold-l`}>
            See where support goes →
          </Link>
        </div>
      </div>
    </section>
  )
}
