/**
 * Google Maps search links for tap-to-map venue addresses (B3).
 * Same URL format as the facility card (src/components/landing/HomeFacilitySection.tsx).
 */
export type MapsPlace = {
  venue?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
}

const clean = (value: string | null | undefined): string => (value ?? '').trim().replace(/\s+/g, ' ')

/**
 * "street, city, state" when a street is set, otherwise "venue, city, state".
 * Blank parts are skipped; returns null when every part is blank.
 */
export function mapsUrl(place: MapsPlace): string | null {
  const lead = clean(place.street) || clean(place.venue)
  const parts = [lead, clean(place.city), clean(place.state)].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}
