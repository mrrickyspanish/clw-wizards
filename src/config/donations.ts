/**
 * The donation kill switch.
 *
 * Donations were held off until the club's banking details were on file with
 * Stripe — money would otherwise have been collected with nowhere to settle.
 * That condition is met: the club's Stripe account is activated and live,
 * which is not possible without a bank account attached for payouts.
 *
 * ── TO TURN DONATIONS BACK OFF ───────────────────────────────────────────
 *   Set DONATIONS_ENABLED to false. That is the whole change.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Nothing is deleted either way. Every amount preset, label, layout and
 * checkout call lives in the components regardless — this flag only chooses
 * which branch renders, so it can be flipped in both directions with no copy
 * to rewrite and no buttons to rebuild.
 *
 * Covers all three donation surfaces, which share the `donation` checkout
 * flow: the home page panel, /sponsorship/donate (one-time), and
 * /sponsorship/boosters (recurring). It deliberately does NOT cover corporate
 * sponsorship or season dues — those are separate flows that were never gated.
 */
export const DONATIONS_ENABLED = true

/** Heading shown in place of a donation form while donations are off. */
export const DONATIONS_COMING_SOON_TITLE = 'Online giving is coming soon'

/**
 * Body copy for the same. Says what is actually true — the club is standing up
 * secure payment processing — without promising a date it cannot keep, and
 * points at a channel that works today.
 */
export const DONATIONS_COMING_SOON_BODY =
  'We are finishing setup on secure online payments. Donations will open here shortly. If you would like to give in the meantime, please reach out and we will help you directly.'

/** Short label for buttons and cards that would otherwise start a donation. */
export const DONATIONS_COMING_SOON_LABEL = 'Coming soon'
