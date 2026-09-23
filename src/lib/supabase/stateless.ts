import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Anon-key client that keeps nothing: no cookies, no stored session, no token
 * refresh. Server-only, and specifically for checking someone's credentials
 * out of band — signing in through this proves they own the password without
 * touching whatever session the current request is already carrying.
 *
 * Never call signOut() on a client from here. supabase-js defaults that to
 * global scope, which would revoke the person's real browser session too.
 */
export function createStatelessSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
