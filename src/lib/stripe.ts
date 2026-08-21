import Stripe from 'stripe'

import { reportEnvironmentReadiness } from '@/lib/alerts'

let client: Stripe | null = null

export function getStripeClient() {
  reportEnvironmentReadiness()
  if (client) return client

  // Trimmed because pasting a key into a hosting dashboard very easily carries
  // a trailing newline, and Stripe rejects the request with an error that
  // points at the signature rather than at the stray whitespace.
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error('Stripe is not configured: missing STRIPE_SECRET_KEY.')
  }

  client = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  return client
}
