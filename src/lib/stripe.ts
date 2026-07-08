import Stripe from 'stripe'

import { reportEnvironmentReadiness } from '@/lib/alerts'

let client: Stripe | null = null

export function getStripeClient() {
  reportEnvironmentReadiness()
  if (client) return client

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe is not configured: missing STRIPE_SECRET_KEY.')
  }

  client = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })
  return client
}
