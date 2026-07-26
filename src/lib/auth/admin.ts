import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * True when the signed-in user is a FULL admin (role='admin', admin_scope='full')
 * — the tier allowed to edit public website content and manage the admin team.
 * Server-only helper; use it to gate actions/pages on top of the RLS + middleware
 * that already enforce the same rule (defense in depth).
 */
export async function isFullAdmin(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_scope')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' && profile?.admin_scope === 'full'
}
