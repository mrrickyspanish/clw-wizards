import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole } from '@/types/database'

export async function getSessionRole(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, role: null as AppRole | null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return { user, role: null as AppRole | null }

  return { user, role: profile.role as AppRole }
}

export function homeForRole(role: AppRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  if (role === 'parent') return '/dashboard'
  return '/login'
}
