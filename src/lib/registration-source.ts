// How a wrestler first got into the system.
//
// The club's Google Form registrations were loaded in a single run of
// scripts/import-registrants.mjs on 25 Aug 2026, so every wrestler that run
// created has a created_at inside that one minute. Every other wrestler was
// added on the website, almost always by their parent. If the club imports
// another batch, add its window here.

const FORM_IMPORT_WINDOWS: { from: string; to: string }[] = [
  { from: '2026-08-25T20:56:00Z', to: '2026-08-25T20:57:00Z' },
]

export type WrestlerSource = 'import' | 'website'

export const WRESTLER_SOURCE_LABELS: Record<WrestlerSource, string> = {
  import: 'Google Form import',
  website: 'Added on website',
}

export function wrestlerSource(createdAt: string | null | undefined): WrestlerSource {
  const at = createdAt ? Date.parse(createdAt) : NaN
  if (Number.isNaN(at)) return 'website'
  return FORM_IMPORT_WINDOWS.some(({ from, to }) => at >= Date.parse(from) && at < Date.parse(to))
    ? 'import'
    : 'website'
}
