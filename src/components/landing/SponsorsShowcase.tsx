import type { Sponsor } from '@/types/database'

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
  if (sponsors.length === 0) return null

  // Two identical copies of the list make the -50% translate loop seamlessly.
  const track = [...sponsors, ...sponsors]

  return (
    <div className="chamfer-md card-depth flex h-full flex-col border border-clw-gold/10 bg-clw-black-2 p-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-clw-white">Supported by our community</h2>

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
