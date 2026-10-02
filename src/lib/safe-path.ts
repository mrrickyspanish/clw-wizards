const BASE = 'https://internal.invalid'

/**
 * Returns `value` only if it is a path on THIS site, otherwise null.
 *
 * Every redirect target that arrives in a URL (`redirectTo`, `next`) passes
 * through here. The check these replaced -- starts with "/" and not "//" --
 * let `/\evil.example` straight through: browsers read a backslash as a
 * slash, so after a successful sign-in the parent was sent to another site.
 * That is the setup for a convincing phishing page on the club's own link.
 *
 * Rather than list the tricks (backslashes, tabs and newlines the URL parser
 * strips, encoded variants), resolve the value exactly as a browser would and
 * accept it only if it is still on our origin.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  try {
    const url = new URL(value, BASE)
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
