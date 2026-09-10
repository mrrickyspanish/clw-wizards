/**
 * Formats a cents amount as US currency with thousands separators, e.g.
 * 3334500 -> "$33,345.00". The `$${(cents / 100).toFixed(2)}` pattern this
 * replaces doesn't group thousands, so any balance over $999 rendered as an
 * unreadable run of digits (e.g. "$33345.00").
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
