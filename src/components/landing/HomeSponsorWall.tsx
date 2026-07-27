import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor, SponsorTierRow } from '@/types/database'

// Three visual weights the tiers collapse into, driven by each tier's rank in
// sort_order (0 = top). Top-tier logos are large and few-per-row; lower tiers
// get progressively smaller tiles packed more densely — the standard "sponsor
// wall" hierarchy where prominence tracks contribution.
const WEIGHTS = [
  {
    grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    tile: 'min-h-[104px] px-8 sm:min-h-[124px]',
    img: 'max-h-14 sm:max-h-[4.5rem]',
    name: 'text-2xl sm:text-3xl',
  },
  {
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    tile: 'min-h-[84px] px-6 sm:min-h-[96px]',
    img: 'max-h-11 sm:max-h-12',
    name: 'text-xl sm:text-2xl',
  },
  {
    grid: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
    tile: 'min-h-[68px] px-4 sm:min-h-[76px]',
    img: 'max-h-8 sm:max-h-10',
    name: 'text-base sm:text-lg',
  },
] as const

function tierPrice(cents: number | null) {
  if (cents == null) return 'Contact us'
  return `$${(cents / 100).toLocaleString('en-US')}`
}

function SponsorTile({ sponsor, weight }: { sponsor: Sponsor; weight: (typeof WEIGHTS)[number] }) {
  const inner = sponsor.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary external host, next/image allowlist impractical
    <img
      src={sponsor.logo_url}
      alt={sponsor.name}
      className={`w-auto object-contain ${weight.img}`}
    />
  ) : (
    <span className={`text-center font-display uppercase leading-none tracking-wide text-clw-ink ${weight.name}`}>
      {sponsor.name}
    </span>
  )

  const tileClass = `chamfer-sm flex items-center justify-center border border-clw-ink/10 bg-white py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)] transition ${weight.tile}`

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sponsor.name}
        className={`${tileClass} hover:-translate-y-1 hover:border-clw-gold/50`}
      >
        {inner}
      </a>
    )
  }
  return <div className={tileClass}>{inner}</div>
}

export async function HomeSponsorWall() {
  const supabase = await createServerSupabase()

  const [{ data: sponsorData }, { data: tierData }] = await Promise.all([
    supabase.from('sponsors').select('*').eq('active', true),
    supabase.from('sponsor_tiers').select('*').eq('active', true).order('sort_order', { ascending: true }),
  ])

  const sponsors = (sponsorData ?? []) as Sponsor[]
  const tiers = (tierData ?? []) as SponsorTierRow[]

  // Group active sponsors under their tier, keeping tiers in sort_order and
  // dropping any tier with no sponsors so the wall never shows an empty row.
  const populatedTiers = tiers
    .map((tier, index) => ({
      tier,
      weight: WEIGHTS[Math.min(index, WEIGHTS.length - 1)],
      sponsors: sponsors.filter((s) => s.tier === tier.slug),
    }))
    .filter((group) => group.sponsors.length > 0)

  const hasSponsors = populatedTiers.length > 0

  return (
    <section className="section-light relative isolate overflow-hidden border-y border-clw-gold/25 bg-[#ECECEE] px-5 py-16 text-clw-ink sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16 2xl:px-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_82%_4%,rgba(240,192,32,.1),transparent_28%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="font-cond text-sm uppercase tracking-[0.32em] text-clw-gold-on-light">Proud Partners</p>
          <h2 className="mt-4 uppercase leading-[0.92] text-clw-ink">
            <span className="mr-2 inline font-cond text-[clamp(2.2rem,9vw,4.6rem)] font-light tracking-[-0.04em] sm:mr-3">
              Backed by our
            </span>
            <span className="inline font-display text-[clamp(2.45rem,10vw,5.2rem)] font-black tracking-[-0.035em] text-clw-gold-on-light">
              Community.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-clw-muted-dark sm:text-xl">
            {hasSponsors
              ? 'The businesses and families whose support keeps our wrestlers on the mat, in the room, and competing all season.'
              : 'Local businesses power this club. Add your logo to the room the whole community is watching.'}
          </p>
        </header>

        {hasSponsors ? (
          <div className="mt-12 space-y-12 sm:mt-14 sm:space-y-14">
            {populatedTiers.map(({ tier, weight, sponsors: tierSponsors }) => (
              <div key={tier.slug}>
                <div className="flex items-center gap-4">
                  <p className="whitespace-nowrap font-cond text-sm uppercase tracking-[0.28em] text-clw-gold-on-light">
                    {tier.label}
                  </p>
                  <span aria-hidden className="h-px flex-1 bg-clw-ink/15" />
                </div>
                <div className={`mt-6 grid gap-4 ${weight.grid}`}>
                  {tierSponsors.map((sponsor) => (
                    <SponsorTile key={sponsor.id} sponsor={sponsor} weight={weight} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 sm:mt-14">
            {tiers.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.slug}
                    className="chamfer-sm flex flex-col justify-between border border-dashed border-clw-ink/25 bg-white/60 p-6"
                  >
                    <div>
                      <p className="font-display text-2xl uppercase leading-none text-clw-ink">{tier.label}</p>
                      <p className="mt-3 font-cond text-2xl tracking-wide text-clw-gold-on-light">
                        {tierPrice(tier.price_cents)}
                      </p>
                    </div>
                    <p className="mt-6 font-cond text-sm uppercase tracking-[0.24em] text-clw-muted-dark">
                      Your logo here
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/sponsorship#sponsors"
            className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-ink transition hover:bg-clw-gold-l"
          >
            Become a sponsor <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sponsorship"
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-gold-on-light/45 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-gold-on-light transition hover:border-clw-gold-on-light"
          >
            See all the ways to support
          </Link>
        </div>
      </div>
    </section>
  )
}
