import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { readCredential } from '@/lib/env'

/**
 * Service-role client — bypasses RLS. Only for server-only contexts that have
 * already authorized the operation themselves: Stripe/QStash webhooks, cron
 * handlers, and the auth trigger. Never import this into anything reachable
 * from a client component.
 */
export function createAdminSupabase(fetcher?: typeof fetch) {
  return createClient<Database>(
    readCredential('NEXT_PUBLIC_SUPABASE_URL')!,
    readCredential('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false }, ...(fetcher ? { global: { fetch: fetcher } } : {}) }
  )
}
