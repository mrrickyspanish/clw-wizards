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

/**
 * Wrestlers the user can see but not change: those reached only through a
 * club-locked guardian link. The user may still view, pay and upload for them;
 * registration, details and contacts belong to the owning account or the club.
 * Mirrors public.manages_athlete(), which enforces the same rule in the
 * database -- this copy only decides what the page offers.
 */
export async function resolveReadOnlyAthleteIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  athletes: { id: string; parent_id: string }[]
): Promise<Set<string>> {
  const readOnly = new Set<string>()
  if (!userId || !athletes.some((a) => a.parent_id !== userId)) return readOnly
  const { data } = await supabase
    .from('family_guardians')
    .select('owner_id, athlete_ids, locked')
    .eq('guardian_id', userId)
  const links = data ?? []
  for (const a of athletes) {
    if (a.parent_id === userId) continue
    const managed = links.some(
      (l) => l.owner_id === a.parent_id && !l.locked && (l.athlete_ids === null || l.athlete_ids.includes(a.id))
    )
    if (!managed) readOnly.add(a.id)
  }
  return readOnly
}
