import { Client, Receiver } from '@upstash/qstash'

let client: Client | null = null

/**
 * Thrown when QStash credentials are absent from the environment. Distinct
 * from a publish that was attempted and failed, so callers can tell "nobody
 * wired this up" apart from "Upstash rejected us" and report accordingly.
 */
export class QstashNotConfiguredError extends Error {
  constructor(message = 'QStash is not configured: missing QSTASH_TOKEN.') {
    super(message)
    this.name = 'QstashNotConfiguredError'
  }
}

/**
 * Non-throwing counterpart to getQstashClient(), for render-time checks that
 * want to warn before a send is attempted rather than blow up mid-request.
 */
export function isQstashConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN)
}

export function getQstashClient() {
  if (client) return client

  const token = process.env.QSTASH_TOKEN
  if (!token) {
    throw new QstashNotConfiguredError()
  }

  client = new Client({ token })
  return client
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/**
 * QStash delivers jobs by calling us back over the public internet, so a
 * loopback siteUrl() can never receive one. Catching it here turns a job that
 * would vanish silently into an error the sender actually sees.
 */
export function isPubliclyReachableSiteUrl(): boolean {
  try {
    const { hostname, protocol } = new URL(siteUrl())
    if (protocol !== 'https:' && protocol !== 'http:') return false
    return !['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)
  } catch {
    return false
  }
}

/**
 * Everything that must be present for an admin-composed blast to actually
 * reach an inbox. Surfaced on the Communications page so a misconfigured
 * environment is visible *before* someone composes to a few hundred parents,
 * rather than as an error after they hit send.
 */
export function commsQueueStatus(): { ready: boolean; missing: string[] } {
  const missing: string[] = []

  if (!isQstashConfigured()) missing.push('QSTASH_TOKEN')
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) missing.push('QSTASH_CURRENT_SIGNING_KEY')
  if (!process.env.QSTASH_NEXT_SIGNING_KEY) missing.push('QSTASH_NEXT_SIGNING_KEY')
  if (!isPubliclyReachableSiteUrl()) missing.push('NEXT_PUBLIC_SITE_URL')
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')

  return { ready: missing.length === 0, missing }
}

/**
 * Verifies a QStash job request actually came from QStash, not a forged
 * caller hitting the job endpoint directly. Job routes are unauthenticated by
 * Next.js middleware (they're plain API routes), so this signature check is
 * the only thing standing between the job and the public internet.
 */
export async function verifyQstashSignature(request: Request, body: string): Promise<boolean> {
  const signature = request.headers.get('Upstash-Signature')
  if (!signature) return false

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!currentSigningKey || !nextSigningKey) return false

  const receiver = new Receiver({ currentSigningKey, nextSigningKey })
  return receiver.verify({ signature, body })
}
