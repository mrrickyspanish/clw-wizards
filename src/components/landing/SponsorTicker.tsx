import { createServerSupabase } from '@/lib/supabase/server'
import type { Sponsor, SponsorTierRow } from '@/types/database'

// The top-tier ("Platinum") recognition slot: a slim marquee that sits in the
// empty band under the nav, above the hero headline, on every marketing page.
// Only the single highest tier (lowest sort_order) earns this placement — its
// value is scarcity + being named, hyperlinked, in front of every visitor.
export async function SponsorTicker() {
  const supabase = await createServerSupabase()

  const { data: tierData } = await supabase
    .from('sponsor_tiers')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(1)

  const topTier = (tierData?.[0] ?? null) as SponsorTierRow | null
  if (!topTier) return null

  const { data: sponsorData } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .eq('tier', topTier.slug)

  const sponsors = (sponsorData ?? []) as Sponsor[]

  // Empty state: keep the slot alive as a subtle recruitment line rather than
  // dead space — it's a standing pitch for the club's most valuable placement.
  if (sponsors.length === 0) {
    return (
      <div className="border-b border-clw-gold/20 bg-clw-black-2/90">
        <a
          href="/sponsorship#sponsors"
          className="mx-auto flex items-center justify-center gap-2.5 px-5 py-2.5 text-center font-cond text-sm uppercase tracking-[0.2em] text-clw-gold transition-colors hover:text-clw-gold-l"
        >
          <span aria-hidden className="text-clw-gold">
            ★
          </span>
          {topTier.label} sponsorship available — put your business in front of every visitor
          <span aria-hidden>→</span>
        </a>
      </div>
    )
  }

  // Repeat the list until it comfortably fills the widest viewport, then double
  // the whole thing so the -50% marquee translate loops seamlessly.
  let filled = sponsors
  while (filled.length < 8) filled = [...filled, ...sponsors]
  const loop = [...filled, ...filled]

  return (
    <div className="relative border-b border-clw-gold/25 bg-clw-black-2/90">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_50%_-40%,rgba(240,192,32,.16),transparent_60%)]"
      />
      <div className="marquee-group marquee-mask relative overflow-hidden">
        <div className="marquee-track flex w-max items-center py-2.5">
          {loop.map((sponsor, index) => {
            const label = (
              <span className="flex items-center gap-2.5 whitespace-nowrap pr-3">
                <span aria-hidden className="text-[0.7rem] text-clw-gold">
                  ★
                </span>
                <span className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">
                  Proud {topTier.label}
                </span>
                <span aria-hidden className="text-clw-gold/40">
                  /
                </span>
              </span>
            )
            const name = sponsor.website_url ? (
              <a
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-cond text-sm uppercase tracking-[0.14em] text-clw-white underline-offset-4 transition-colors hover:text-clw-gold hover:underline sm:text-base"
              >
                {sponsor.name}
              </a>
            ) : (
              <span className="font-cond text-sm uppercase tracking-[0.14em] text-clw-white sm:text-base">
                {sponsor.name}
              </span>
            )
            return (
              <span key={`${sponsor.id}-${index}`} className="flex items-center gap-2.5 pr-12">
                {label}
                {name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
