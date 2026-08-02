import type { SeasonPriceTier, SeasonRegistration } from '@/types/database'

export type DuesPricing = {
  // What a wrestler pays if submitted today.
  amountCents: number
  // The tier today falls in, or null when the season has no ladder configured
  // and prices at its flat rate.
  currentTier: SeasonPriceTier | null
  // The next step up, so the UI can say "register by X or the price rises to Y".
  // Null once today is past the last tier.
  nextTier: SeasonPriceTier | null
  // Every tier, earliest first, for showing the full ladder.
  tiers: SeasonPriceTier[]
}

/**
 * The price a wrestler pays if they submit today. Mirrors the pricing branch in
 * the submit_season_enrollment SQL function
 * (supabase/migrations/20260802000003_season_price_tiers.sql) -- keep both in
 * sync if this logic ever changes. Display can drift from what actually gets
 * charged if these two diverge, so there is exactly one rule: the tier whose
 * window contains today, and the season's flat dues_amount_cents when no tier
 * does.
 *
 * Tier windows cannot overlap -- the table carries an exclusion constraint --
 * so "the tier containing today" is never ambiguous.
 */
export function resolveDuesPricing(
  season: SeasonRegistration,
  tiers: SeasonPriceTier[],
  today: string
): DuesPricing {
  const sorted = [...tiers].sort((a, b) => a.starts_on.localeCompare(b.starts_on))
  const currentTier = sorted.find((tier) => tier.starts_on <= today && tier.ends_on >= today) ?? null
  const nextTier = sorted.find((tier) => tier.starts_on > today) ?? null

  return {
    amountCents: currentTier?.amount_cents ?? season.dues_amount_cents,
    currentTier,
    nextTier,
    tiers: sorted,
  }
}
