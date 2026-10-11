// Which USA Wrestling card belongs to a registration. The card bound to the
// registration (usa_card_document_id) when there is one; otherwise the
// wrestler's newest card uploaded since the season opened, or a verified card
// (verified cards carry over). The same rule the parent's registration page and
// the "missing a USA Wrestling card" audience use.
//
// Without the fallback, a card uploaded after the registration existed (an
// imported registration, or a card added later from Documents) was never
// bound: the email list counted it, but Registrations said "card missing" and
// offered no View or Verify button.

export type CardDoc = { id: string; athlete_id: string; verified: boolean; uploaded_at: string }

export function registrationCard<T extends CardDoc>(
  boundId: string | null,
  athleteCards: T[],
  seasonOpenDate: string | null | undefined
): T | undefined {
  if (boundId) {
    const bound = athleteCards.find((doc) => doc.id === boundId)
    if (bound) return bound
  }
  const window = seasonOpenDate ? `${seasonOpenDate}T00:00:00` : null
  return [...athleteCards]
    .filter((doc) => doc.verified || !window || doc.uploaded_at >= window)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))[0]
}
