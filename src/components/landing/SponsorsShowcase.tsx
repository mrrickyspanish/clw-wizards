import type { Sponsor } from '@/types/database'
import { Reveal } from './Reveal'

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
    <img src={sponsor.logo_url} alt={sponsor.name} className="h-9 w-auto object-contain" />
  ) : (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-clw-gold/30 font-display text-sm text-clw-gold">
        {initials}
      </span>
      <span className="font-cond text-lg uppercase tracking-wide text-clw-white">{sponsor.name}</span>
    </span>
  )

  return (
    <div className="flex shrink-0 items-center rounded-lg border border-clw-gold/10 bg-clw-black-2 px-6 py-4">
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
    <section id="sponsors" className="scroll-mt-20 border-b border-clw-gold/10 bg-clw-black py-16 md:py-24">
      <Reveal className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-4xl text-clw-gold">Our sponsors</h2>
        <p className="mt-2 text-clw-gray">Thank you to the businesses that back our wrestlers.</p>
      </Reveal>

      {/* The "lazy river": a continuous, edge-faded marquee that pauses on hover. */}
      <div className="marquee-group marquee-mask mt-10 overflow-hidden">
        <div className="marquee-track flex w-max gap-4">
          {track.map((s, i) => (
            <SponsorChip key={`${s.id}-${i}`} sponsor={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
