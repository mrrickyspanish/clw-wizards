import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole, AdminScope } from '@/types/database'

export async function getSessionRole(supabase: SupabaseClient) {
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (!user)
    return { user: null, role: null as AppRole | null, adminScope: null as AdminScope | null, onboardingCompleted: false, sessionError }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, admin_scope, is_active, onboarding_completed_at')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active)
    return { user, role: null as AppRole | null, adminScope: null as AdminScope | null, onboardingCompleted: false,
      accessError: profileError ?? { code: profile ? 'profile_inactive' : 'profile_missing', message: profile ? 'Account profile is inactive' : 'Authenticated user has no profile' } }

  return {
    user,
    role: profile.role as AppRole,
    adminScope: (profile.admin_scope ?? null) as AdminScope | null,
    onboardingCompleted: profile.onboarding_completed_at !== null,
  }
}

export function homeForRole(role: AppRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  if (role === 'parent') return '/dashboard'
  return '/login'
}
