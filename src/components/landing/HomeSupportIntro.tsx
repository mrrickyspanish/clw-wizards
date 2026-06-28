import Link from 'next/link'
import { CircleDollarSign, HandHeart, HeartHandshake } from 'lucide-react'

const SUPPORT_OPTIONS = [
  {
    title: 'Donate',
    body: 'Help cover equipment, tournament costs, scholarships, and the day-to-day needs that keep the room strong.',
    href: '/sponsorship#donate',
    cta: 'Donate today',
    Icon: CircleDollarSign,
  },
  {
    title: 'Sponsor',
    body: 'Give your business a direct way to support Crystal Lake wrestling families and be seen by the club community.',
    href: '/sponsorship#sponsors',
    cta: 'See sponsor options',
    Icon: HeartHandshake,
  },
  {
    title: 'Boosters',
    body: 'Join the families, alumni, and supporters who help fund steady growth throughout the season.',
    href: '/sponsorship#boosters',
    cta: 'Join the boosters',
    Icon: HandHeart,
  },
]

export function HomeSupportIntro() {
  return (
    <section className="section-light relative overflow-hidden border-y border-clw-gold/35 bg-clw-cream px-5 py-14 text-clw-ink sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
      <div className="absolute inset-0 opacity-65 [background-image:radial-gradient(circle_at_80%_5%,rgba(240,192,32,.22),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.72),transparent_44%)]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-2 select-none font-display text-[11rem] leading-none text-clw-gold-dim/[0.08] sm:text-[14rem] lg:text-[18rem]"
      >
        W
      </span>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-ink">Support</p>
            <h2 className="mt-6 max-w-3xl uppercase leading-[0.92] text-clw-ink">
              <span className="block font-cond text-[clamp(3rem,12vw,5rem)] font-light tracking-[-0.04em]">
                Many ways to help.
              </span>
              <span className="block font-display text-[clamp(3.4rem,13vw,5.6rem)] font-black tracking-[-0.035em]">
                One room to build.
              </span>
            </h2>
          </div>

          <div className="max-w-2xl text-xl leading-relaxed text-clw-muted-dark sm:text-2xl sm:leading-relaxed lg:justify-self-end">
            <p>
              Wizards Wrestling Club exists because families, alumni, local businesses, and community partners like you choose to invest in young wrestlers.
            </p>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {SUPPORT_OPTIONS.map(({ title, body, href, cta, Icon }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-[210px] flex-col border border-clw-gold/45 bg-[#0B0B0B] p-5 text-white shadow-2xl shadow-clw-black/10 transition hover:-translate-y-1 hover:border-clw-gold sm:min-h-[230px] sm:p-6"
            >
              <div className="flex items-center justify-between gap-6">
                <Icon className="h-10 w-10 text-clw-gold sm:h-11 sm:w-11" strokeWidth={2.35} />
              </div>
              <h3 className="mt-7 font-display text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">
                {title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-white/68 sm:text-lg">
                {body}
              </p>
              <span className="mt-auto pt-6 font-cond text-base uppercase tracking-[0.2em] text-clw-gold transition group-hover:text-clw-gold-l sm:text-lg">
                {cta} →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-start border-t border-clw-gold/35 pt-7">
          <Link href="/sponsorship" className="font-cond text-xl uppercase tracking-[0.18em] text-clw-gold-ink underline-offset-4 hover:text-clw-ink hover:underline">
            View sponsorship page →
          </Link>
        </div>
      </div>
    </section>
  )
}
