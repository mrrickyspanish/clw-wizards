import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { churchRoleFor, type ChurchRole } from '@/lib/demo-roles'
import { createServerSupabase } from '@/lib/supabase/server'

/** The signed-in church demo role, or null everywhere else. */
export async function currentChurchRole(): Promise<ChurchRole | null> {
  if (!CHURCH_READ_ONLY) return null
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return churchRoleFor(data.user?.email)
}
