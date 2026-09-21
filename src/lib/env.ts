/**
 * Reads a credential out of the environment, trimming it and treating a blank
 * value as absent.
 *
 * A key pasted into a hosting dashboard very easily carries a trailing newline
 * or a stray space. The service then rejects it with an *authentication* error
 * — "invalid token", "signature mismatch" — which sends you looking at the
 * integration instead of at the env var, where the problem actually is. This
 * project has already lost time to it once with Stripe (see lib/stripe.ts), so
 * every credential read goes through here.
 *
 * Trimming cannot fix a genuinely wrong key. It only removes whitespace as a
 * candidate explanation, so an auth failure means what it says.
 */
export function readCredential(name: string): string | undefined {
  const raw = process.env[name]
  if (!raw) return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
