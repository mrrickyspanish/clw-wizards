// Plain-text search for the admin lists (families, registrations, dues).
// The lists are a few hundred rows at most, so they are filtered in memory
// after loading rather than in the database query.

/** Lowercased, accents and punctuation removed: "Tre’Lyn" -> "trelyn". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, '')
}

/**
 * True when every word of the query appears somewhere in the given fields, so
 * "tj simmons" finds TJ Simmons and "vocos" finds anyone named Vocos. An empty
 * query matches everything.
 */
export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalizeForSearch(fields.filter(Boolean).join(' '))
  return words.every((word) => haystack.includes(word))
}
