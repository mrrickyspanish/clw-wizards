import type { Sponsor } from '@/types/database'

const SPONSOR_PLACEHOLDERS: Sponsor[] = [
  {
    id: 'placeholder-1',
    name: 'Sponsor Slot',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-2',
    name: 'Community Partner',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-3',
    name: 'Local Supporter',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'placeholder-4',
    name: 'Family Business',
    tier: 'yellow',
    logo_url: null,
    website_url: null,
    contact_name: null,
    contact_email: null,
    amount_cents: null,
    recurring: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    active: true,
    golf_outing_hole: false,
    notes: null,
    created_at: '',
    updated_at: '',
  },
]

// One chip per sponsor: real logo when provided, otherwise a monogram + name
// (these are local businesses, not known brands, so a wordmark chip is the
// honest credibility, per the logo-wall guidance).
function SponsorChip({ sponsor }: { sponsor: Sponsor }) {
  const initials = sponsor.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const inner = sponsor.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary external host, next/image allowlist impractical
    <img src={sponsor.logo_url} alt={sponsor.name} className="h-7 w-auto object-contain" />
  ) : (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-clw-gold/30 font-display text-xs text-clw-gold">
        {initials}
      </span>
      <span className="font-cond text-sm uppercase tracking-wide text-clw-white">{sponsor.name}</span>
    </span>
  )

  return (
    <div className="flex shrink-0 items-center rounded-md border border-clw-gold/10 bg-clw-black/40 px-4 py-3">
      {sponsor.website_url ? (
        <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" aria-label={sponsor.name}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  )
}

export function SponsorsShowcase({ sponsors }: { sponsors: Sponsor[] }) {
  const hasSponsors = sponsors.length > 0
  const sponsorList = hasSponsors ? sponsors : SPONSOR_PLACEHOLDERS
  // Two identical copies of the list make the -50% translate loop seamlessly.
  const track = [...sponsorList, ...sponsorList]

  return (
    <div className="chamfer-md card-depth flex h-full min-h-[170px] flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl uppercase tracking-wide text-clw-white">Supported by our community</h2>
          <p className="mt-1 text-sm text-clw-gray">
            {hasSponsors ? 'Thank you to the businesses that back our wrestlers.' : 'Sponsor logos will live here as partners come on board.'}
          </p>
        </div>
        <a href="#donate" className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-clw-gold hover:text-clw-gold-l sm:block">
          Sponsor CLW
        </a>
      </div>

      {/* The "lazy river": a continuous, edge-faded marquee that pauses on hover. */}
      <div className="marquee-group marquee-mask mt-5 flex-1 overflow-hidden">
        <div className="marquee-track flex h-full w-max items-center gap-3">
          {track.map((s, i) => (
            <SponsorChip key={`${s.id}-${i}`} sponsor={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
