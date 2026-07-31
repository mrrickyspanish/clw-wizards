import type { SeasonRegistration } from '@/types/database'

export type DuesPricing = {
  // What a wrestler pays if submitted today.
  amountCents: number
  // Whether today's price is the discounted one.
  isDiscounted: boolean
  regularAmountCents: number
  discountAmountCents: number | null
  discountDeadline: string | null
}

/**
 * The price a wrestler pays if they submit today. Mirrors the pricing branch
 * in the submit_season_enrollment SQL function
 * (supabase/migrations/20260731000004_season_early_bird_pricing.sql) --
 * keep both in sync if this logic ever changes. Display can drift from what
 * actually gets charged if these two diverge, so there is exactly one rule:
 * on or before the deadline, the discount price; otherwise the regular one.
 */
export function resolveDuesPricing(season: SeasonRegistration, today: string): DuesPricing {
  const hasDiscount = season.early_bird_price_cents != null && season.early_bird_deadline != null
  const inDiscountWindow = hasDiscount && today <= season.early_bird_deadline!

  return {
    amountCents: inDiscountWindow ? season.early_bird_price_cents! : season.dues_amount_cents,
    isDiscounted: inDiscountWindow,
    regularAmountCents: season.dues_amount_cents,
    discountAmountCents: season.early_bird_price_cents,
    discountDeadline: season.early_bird_deadline,
  }
}
