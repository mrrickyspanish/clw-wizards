/**
 * The donation kill switch.
 *
 * Donations are off until the club's banking details are on file with Stripe.
 * Money would otherwise be collected with nowhere to settle.
 *
 * ── TO TURN DONATIONS BACK ON ────────────────────────────────────────────
 *   Set DONATIONS_ENABLED to true. That is the whole change.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Nothing was deleted to switch them off. Every amount preset, label, layout
 * and checkout call still lives in the components exactly as it did before —
 * this flag only chooses which branch renders. Flipping it restores the prior
 * behavior byte for byte, with no copy to rewrite and no buttons to rebuild.
 *
 * Covers all three donation surfaces, which share the `donation` checkout
 * flow: the home page panel, /sponsorship/donate (one-time), and
 * /sponsorship/boosters (recurring). It deliberately does NOT cover corporate
 * sponsorship or season dues — those are separate flows the club is still
 * taking.
 */
export const DONATIONS_ENABLED = false

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
