import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole, AdminScope } from '@/types/database'

async function hasExplicitFamilyConnection(supabase: SupabaseClient, userId: string) {
  const [{ data: ownedAthletes }, { data: ownedFamily }, { data: joinedFamily }] = await Promise.all([
    supabase.from('athletes').select('id').eq('parent_id', userId).limit(1),
    supabase.from('family_guardians').select('id').eq('owner_id', userId).limit(1),
    supabase.from('family_guardians').select('id').eq('guardian_id', userId).limit(1),
  ])

  return Boolean(ownedAthletes?.length || ownedFamily?.length || joinedFamily?.length)
}

export async function getSessionRole(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return {
      user: null,
      role: null as AppRole | null,
      adminScope: null as AdminScope | null,
      fullName: null as string | null,
      onboardingCompleted: false,
      canAccessParentPortal: false,
    }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, admin_scope, is_active, onboarding_completed_at')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active)
    return {
      user,
      role: null as AppRole | null,
      adminScope: null as AdminScope | null,
      fullName: null as string | null,
      onboardingCompleted: false,
      canAccessParentPortal: false,
    }

  const role = profile.role as AppRole
  const canAccessParentPortal = role === 'parent' || (await hasExplicitFamilyConnection(supabase, user.id))

  return {
    user,
    role,
    adminScope: (profile.admin_scope ?? null) as AdminScope | null,
    fullName: profile.full_name ?? null,
    onboardingCompleted: profile.onboarding_completed_at !== null,
    canAccessParentPortal,
  }
}

export function homeForRole(role: AppRole | null) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  if (role === 'parent') return '/dashboard'
  return '/login'
}
