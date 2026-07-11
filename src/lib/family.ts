import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * The set of "family owner" profile ids whose wrestlers a user can see — always
 * themselves, plus any owner who has invited them in as a guardian. Portal reads
 * resolve wrestlers (and their registrations) against `parent_id IN (...)` so a
 * joined co-guardian sees the family's roster, current and future.
 */
export async function resolveFamilyOwnerIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  if (!userId) return []
  const { data } = await supabase.from('family_guardians').select('owner_id').eq('guardian_id', userId)
  const owners = (data ?? []).map((r) => r.owner_id)
  return [userId, ...owners]
}
