import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

export type CommTarget =
  | { type: 'all' }
  | { type: 'practice_group'; practiceGroup: string }
  | { type: 'tournament_registrants'; tournamentId: string }
  | { type: 'outstanding_dues' }
  | { type: 'custom'; profileIds: string[] }

/**
 * Hand-typed Database in src/types/database.ts has no FK relationship
 * metadata for supabase-js's nested `select('table(*)')` join syntax, so
 * targets that depend on another table resolve in two steps: gather the
 * relevant parent_ids, then fetch those profiles directly.
 */
export async function resolveRecipients(target: CommTarget): Promise<Profile[]> {
  const supabase = createAdminSupabase()

  if (target.type === 'all') {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'parent').eq('is_active', true)
    return data ?? []
  }

  if (target.type === 'practice_group') {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .eq('is_active', true)
      .eq('practice_group', target.practiceGroup)
    return data ?? []
  }

  if (target.type === 'tournament_registrants') {
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('parent_id')
      .eq('tournament_id', target.tournamentId)
      .in('status', ['registered', 'confirmed'])

    const parentIds = [...new Set((registrations ?? []).map((r) => r.parent_id))]
    if (!parentIds.length) return []

    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', parentIds)
    return data ?? []
  }

  if (target.type === 'outstanding_dues') {
    const { data: dues } = await supabase
      .from('dues_payments')
      .select('parent_id')
      .in('status', ['pending', 'partial', 'overdue'])

    const parentIds = [...new Set((dues ?? []).map((d) => d.parent_id))]
    if (!parentIds.length) return []

    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', parentIds)
    return data ?? []
  }

  // target.type === 'custom'
  if (!target.profileIds.length) return []
  const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', target.profileIds)
  return data ?? []
}
