import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// NEXT_PUBLIC_* values are inlined at build time, not read at runtime. If a
// build runs without them, these are `undefined` in the shipped bundle even
// when the server has them, so anything that needs a browser client has to
// cope with that instead of assuming the `!` assertions hold.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isBrowserSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function createBrowserSupabase() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
}

/**
 * Same client, but returns null instead of throwing when the public env vars
 * were missing at build time. Use this on marketing pages, where losing a
 * Supabase-backed enhancement should degrade quietly rather than take down
 * the whole React tree.
 */
export function createOptionalBrowserSupabase() {
  if (!isBrowserSupabaseConfigured()) return null
  return createBrowserSupabase()
}
