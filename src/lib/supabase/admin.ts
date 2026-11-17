import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { readCredential } from '@/lib/env'
import { readOnlyGlobal } from '@/lib/demo-readonly'

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
    // On the read-only church demo every change through this client is refused.
    { auth: { autoRefreshToken: false, persistSession: false }, ...readOnlyGlobal(fetcher) }
  )
}

/**
 * Service-role client that can write even on the read-only church demo. Only
 * for the demo's own reset (behind the demo password) and its sign-in buttons.
 */
export function createDemoSetupSupabase() {
  return createClient<Database>(readCredential('NEXT_PUBLIC_SUPABASE_URL')!, readCredential('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
