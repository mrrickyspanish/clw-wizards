import type { Sponsor, SponsorTier } from '@/types/database'

const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum',
  yellow: 'Yellow',
  black: 'Black',
  white: 'White',
  wizard_for_life: 'Wizard for Life',
}

// Display order, highest tier first.
const TIER_ORDER: SponsorTier[] = ['platinum', 'yellow', 'black', 'white', 'wizard_for_life']

export function SponsorsShowcase({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null

  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((group) => group.items.length > 0)

  return (
    <section className="border-b border-clw-gold/10 bg-clw-black">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl text-clw-gold">Our sponsors</h2>
        <p className="mt-2 text-clw-gray">Thank you to the businesses that support our wrestlers.</p>
        <div className="mt-8 space-y-8">
          {byTier.map((group) => (
            <div key={group.tier}>
              <p className="text-xs uppercase tracking-wide text-clw-gray/70">{group.label}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {group.items.map((s) => {
                  // Sponsor logos are arbitrary external URLs (each sponsor's
                  // own host), so next/image's domain allowlist isn't practical
                  // — a plain <img> is the right call here.
                  const content = s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt={s.name} className="h-10 w-auto object-contain" />
                  ) : (
                    <span className="font-medium text-clw-white">{s.name}</span>
                  )
                  return (
                    <div
                      key={s.id}
                      className="flex items-center rounded-md border border-clw-gold/10 bg-clw-black-2 px-4 py-3"
                    >
                      {s.website_url ? (
                        <a href={s.website_url} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
