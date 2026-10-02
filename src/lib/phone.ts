/**
 * Phone numbers arrive as whatever the parent typed. Production held nine
 * different shapes for the same kind of number -- 8155551234, 815-555-1234,
 * (815) 555-1234, +18155551234 and so on -- and the SMS sender handed each one
 * to Twilio exactly as stored. Twilio wants E.164 (+18155551234), so once
 * texting is switched on some of those would have failed.
 *
 * Storage form is the plain 10 digits most families already have. Anything
 * that is not recognisably a US number is kept as typed rather than thrown
 * away -- a person can still read it and fix it.
 */
export function normalizeUsPhone(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return trimmed
}

/** The number in E.164 for Twilio, or null if it is not a dialable US number. */
export function toE164(raw: string | null | undefined): string | null {
  const normalized = normalizeUsPhone(raw)
  return normalized && /^\d{10}$/.test(normalized) ? `+1${normalized}` : null
}
