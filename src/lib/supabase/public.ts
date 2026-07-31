import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Anonymous, cookie-free Supabase client for public marketing content.
 *
 * Reading cookies opts a route into dynamic rendering, so marketing pages that
 * only need publicly readable rows use this instead of createServerSupabase()
 * and stay statically generated.
 *
 * Returns null rather than throwing when the public env vars were not inlined
 * at build time, so a misconfigured build degrades to hiding the content
 * instead of failing the page.
 */
export function createPublicSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
