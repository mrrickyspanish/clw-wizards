import Link from 'next/link'
import { ArrowUpRight, Star } from 'lucide-react'

import type { Sponsor, SponsorTier } from '@/types/database'
import { CTA_LINK } from '@/lib/cta'

const TIER_ORDER: SponsorTier[] = ['platinum', 'yellow', 'black', 'white', 'wizard_for_life']

const TIER_DETAILS: Record<
  SponsorTier,
  {
    eyebrow: string
    title: string
    description: string
    dark: boolean
    cardSize: 'platinum' | 'standard' | 'compact' | 'legacy'
    gridClass: string
  }
> = {
  platinum: {
    eyebrow: 'Premier Partners',
    title: 'Platinum Partners',
    description: 'The sponsors making the largest investment in the room, the wrestlers, and the future of Wizards Wrestling.',
    dark: true,
    cardSize: 'platinum',
    gridClass: 'grid-cols-1 lg:grid-cols-2',
  },
  yellow: {
    eyebrow: 'Gold-Level Recognition',
    title: 'Yellow Sponsors',
    description: 'Community partners providing meaningful support across the Wizards season.',
    dark: false,
    cardSize: 'standard',
    gridClass: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  black: {
    eyebrow: 'Club Partners',
    title: 'Black Sponsors',
    description: 'Local partners helping the club stay equipped, competitive, and connected.',
    dark: true,
    cardSize: 'standard',
    gridClass: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  white: {
    eyebrow: 'Community Support',
    title: 'White Sponsors',
    description: 'Partners and supporters investing directly in opportunities for Wizards wrestlers.',
    dark: false,
    cardSize: 'compact',
    gridClass: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  },
  wizard_for_life: {
    eyebrow: 'Legacy Partners',
    title: 'Wizards for Life',
    description: 'Long-standing supporters whose relationship with the club reaches beyond a single season.',
    dark: true,
    cardSize: 'legacy',
    gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  },
}

const CARD_HEIGHTS = {
  platinum: 'min-h-[250px] sm:min-h-[290px] lg:min-h-[320px]',
  standard: 'min-h-[170px] sm:min-h-[190px]',
  compact: 'min-h-[145px] sm:min-h-[165px]',
  legacy: 'min-h-[160px] sm:min-h-[180px]',
}

// The logo zone is a fixed height and the logo fills it (h-full w-full +
// object-contain), so neither the artwork's aspect ratio nor the length of
// the text below it can change how big the logo renders. Both alternatives
// misbehave: sizing off the intrinsic ratio lets a tall logo stretch its own
// card (AllianceCo pushed its card to twice the height of its row-mates),
// and letting the zone flex means a two-line description steals height from
// the logo. Fixed here, a longer description just makes the card taller.
const LOGO_ZONES = {
  platinum: 'h-40 sm:h-48 lg:h-52',
  standard: 'h-20 sm:h-24',
  compact: 'h-16 sm:h-20',
  legacy: 'h-20 sm:h-24',
}

const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum Partner',
  yellow: 'Yellow Sponsor',
  black: 'Black Sponsor',
  white: 'White Sponsor',
  wizard_for_life: 'Wizard for Life',
}

function sponsorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function PartnerCard({
  sponsor,
  size,
}: {
  sponsor: Sponsor
  size: 'platinum' | 'standard' | 'compact' | 'legacy'
}) {
  // A white or light-colored logo vanishes on the standard cream card, so the
  // whole card flips to black and its name text to white -- one solid dark
  // card rather than a dark box floating inside a light one. Colors are
  // literal hex on purpose: --clw-black is theme-dependent and resolves to
  // off-white under the light theme, which would undo the whole point.
  const dark = Boolean(sponsor.logo_url && sponsor.logo_dark_backdrop)

  const card = (
    <div
      className={`group relative flex ${CARD_HEIGHTS[size]} h-full flex-col overflow-hidden border border-clw-gold/35 p-5 shadow-[0_18px_45px_-28px_rgba(0,0,0,.8)] transition duration-300 hover:-translate-y-1 hover:border-clw-gold hover:shadow-[0_22px_52px_-26px_rgba(240,192,32,.42)] sm:p-6 ${
        dark ? 'bg-[#0B0B0B] text-white' : 'bg-[#FFFDF7] text-[#111111]'
      } ${size === 'platinum' ? 'chamfer-lg' : 'chamfer-md'}`}
    >
      {sponsor.website_url && (
        <ArrowUpRight
          className={`absolute right-4 top-4 h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
            dark ? 'text-clw-gold' : 'text-clw-gold-on-light'
          }`}
        />
      )}

      <div className={`flex ${LOGO_ZONES[size]} shrink-0 items-center justify-center px-1 py-2 sm:px-2`}>
        {sponsor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- sponsor logos can use arbitrary external hosts
          <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} className="h-full w-full object-contain" />
        ) : (
          <span
            className={`flex items-center justify-center border-2 border-clw-gold bg-[#0B0B0B] font-display uppercase text-clw-gold ${
              size === 'platinum' ? 'h-24 w-24 text-4xl sm:h-28 sm:w-28 sm:text-5xl' : 'h-20 w-20 text-3xl'
            }`}
          >
            {sponsorInitials(sponsor.name)}
          </span>
        )}
      </div>

      {/* Trade and description sit in the open rather than behind a hover or
          flip: the point of publishing them is that a crawler can read them,
          and content hidden by default carries less weight. It also keeps one
          behaviour on touch, where the whole card is already a link out to
          the partner and has no second tap to spare. */}
      <div className={`border-t pt-4 text-center ${dark ? 'border-white/15' : 'border-black/10'}`}>
        <p
          className={`font-cond font-semibold uppercase leading-tight tracking-[0.08em] ${
            size === 'platinum' ? 'text-xl sm:text-2xl' : size === 'compact' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
          }`}
        >
          {sponsor.name}
        </p>
        {sponsor.industry && (
          <p
            className={`mt-2 font-cond text-sm font-semibold uppercase tracking-[0.18em] ${
              dark ? 'text-clw-gold' : 'text-clw-gold-on-light'
            }`}
          >
            {sponsor.industry}
          </p>
        )}
        {sponsor.description && size !== 'compact' && (
          <p className={`mt-2 text-base leading-snug ${dark ? 'text-white/75' : 'text-[#444444]'}`}>
            {sponsor.description}
          </p>
        )}
      </div>
    </div>
  )

  if (!sponsor.website_url) return card

  return (
    <a className="block h-full" href={sponsor.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${sponsor.name}`}>
      {card}
    </a>
  )
}

function TierSection({ tier, sponsors }: { tier: SponsorTier; sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null

  const detail = TIER_DETAILS[tier]
  const dark = detail.dark

  return (
    <section
      id={tier}
      className={`relative isolate overflow-hidden border-t border-clw-gold/20 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16 2xl:px-20 ${
        dark ? 'bg-clw-black text-clw-white' : 'section-light bg-[#F7F4EA] text-clw-ink'
      }`}
    >
      {dark && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-35" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(240,192,32,.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,.04),transparent_40%)]" />
        </>
      )}

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(18rem,.28fr)] lg:items-end">
          <div>
            <p className={`font-cond text-sm font-semibold uppercase tracking-[0.3em] ${dark ? 'text-clw-gold' : 'text-clw-gold-on-light'}`}>
              {detail.eyebrow}
            </p>
            <h2 className={`mt-5 font-display text-[clamp(3.2rem,10vw,6rem)] uppercase leading-[0.86] ${dark ? 'text-clw-white' : 'text-clw-ink'}`}>
              {detail.title}
            </h2>
          </div>
          <div className={`text-lg leading-relaxed sm:text-xl lg:text-right ${dark ? 'text-clw-gray' : 'text-clw-muted-dark'}`}>
            <p>{detail.description}</p>
            <p className={`mt-3 font-cond text-sm font-semibold uppercase tracking-[0.18em] ${dark ? 'text-clw-gold' : 'text-clw-gold-on-light'}`}>
              {sponsors.length} {sponsors.length === 1 ? 'partner' : 'partners'}
            </p>
          </div>
        </div>

        <div className="mt-9 h-px w-full bg-clw-gold/35" />

        <div className={`mt-8 grid gap-4 sm:gap-5 ${detail.gridClass}`}>
          {sponsors.map((sponsor) => (
            <PartnerCard key={sponsor.id} sponsor={sponsor} size={detail.cardSize} />
          ))}
        </div>
      </div>
    </section>
  )
}

function sortSponsors(sponsors: Sponsor[]) {
  return [...sponsors].sort((a, b) => {
    const tierDifference = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
    if (tierDifference !== 0) return tierDifference
    return a.name.localeCompare(b.name)
  })
}

export function PartnersWall({ sponsors }: { sponsors: Sponsor[] }) {
  const sorted = sortSponsors(sponsors)

  return (
    <div>
      {TIER_ORDER.map((tier) => (
        <TierSection key={tier} tier={tier} sponsors={sorted.filter((sponsor) => sponsor.tier === tier)} />
      ))}
    </div>
  )
}

export function PartnersProof({ sponsors }: { sponsors: Sponsor[] }) {
  const sorted = sortSponsors(sponsors)
  if (sorted.length === 0) return null

  const featured = sorted.find((sponsor) => sponsor.tier === 'platinum') ?? sorted[0]
  const supporting = sorted.filter((sponsor) => sponsor.id !== featured.id).slice(0, 4)

  return (
    <section className="mt-12 overflow-hidden border border-clw-gold/35 bg-[#0B0B0B] p-5 text-left text-white shadow-2xl shadow-black/15 sm:p-7 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-cond text-sm font-semibold uppercase tracking-[0.28em] text-clw-gold">Current Partners</p>
          <h3 className="mt-3 font-display text-4xl uppercase leading-none text-white sm:text-5xl">Already in their corner.</h3>
        </div>
        <Link href="/partners" className={`${CTA_LINK} text-clw-gold hover:text-clw-gold-l`}>
          Meet all partners <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
        <div className="relative">
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 bg-[#0B0B0B] px-3 py-1.5 font-cond text-sm font-semibold uppercase tracking-[0.16em] text-clw-gold">
            <Star className="h-3.5 w-3.5 fill-current" /> {TIER_LABELS[featured.tier]}
          </div>
          <PartnerCard sponsor={featured} size="platinum" />
        </div>

        {supporting.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {supporting.map((sponsor) => (
              <PartnerCard key={sponsor.id} sponsor={sponsor} size="compact" />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center border border-dashed border-clw-gold/30 px-6 text-center text-[#B0B0B0]">
            Additional partner recognition will appear here as new sponsors join the Wizards.
          </div>
        )}
      </div>
    </section>
  )
}
