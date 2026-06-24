import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole } from '@/types/database'

export async function getSessionRole(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, role: null as AppRole | null, onboardingCompleted: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, onboarding_completed_at')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return { user, role: null as AppRole | null, onboardingCompleted: false }

  return { user, role: profile.role as AppRole, onboardingCompleted: profile.onboarding_completed_at !== null }
}

export function homeForRole(role: AppRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  if (role === 'parent') return '/dashboard'
  return '/login'
}
