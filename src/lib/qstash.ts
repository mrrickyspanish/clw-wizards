import { Client, Receiver } from '@upstash/qstash'

let client: Client | null = null

export function getQstashClient() {
  if (client) return client

  const token = process.env.QSTASH_TOKEN
  if (!token) {
    throw new Error('QStash is not configured: missing QSTASH_TOKEN.')
  }

  client = new Client({ token })
  return client
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
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
