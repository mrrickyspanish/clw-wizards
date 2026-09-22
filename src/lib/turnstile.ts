/**
 * Server-side Cloudflare Turnstile verification, shared by every endpoint
 * that needs to check a token itself rather than delegating to Supabase Auth
 * (which does this internally for its own captchaToken option). Extracted
 * from api/verify-turnstile/route.ts so a new endpoint doesn't need an extra
 * network hop through that route just to reuse this check.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = await res.json()
    return Boolean(data?.success)
  } catch {
    return false
  }
}
