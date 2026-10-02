import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

export type MissingDocument = 'birth_certificate' | 'usa_wrestling_card'

export type CommTarget =
  | { type: 'all' }
  | { type: 'practice_groups'; practiceGroups: string[] }
  | { type: 'tournament_registrants'; tournamentId: string }
  | { type: 'outstanding_dues' }
  | { type: 'missing_document'; documents: MissingDocument[] }
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

  // Parents of any active athlete in the selected practice groups. Resolved
  // through athletes, not a parent-level practice group -- profiles never had
  // a reliable one. A parent-level field existed at one point but nothing
  // ever set it at signup and it couldn't represent a family with kids in
  // more than one group, so it was removed rather than kept as a second,
  // unused way to answer the same question.
  if (target.type === 'practice_groups') {
    if (!target.practiceGroups.length) return []
    const { data: athletes } = await supabase
      .from('athletes')
      .select('parent_id')
      .eq('active', true)
      .in('practice_group', target.practiceGroups)

    const parentIds = [...new Set((athletes ?? []).map((a) => a.parent_id))]
    if (!parentIds.length) return []

    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', parentIds)
    return data ?? []
  }

  // Parents of active athletes still missing any of the selected documents.
  // Read from the uploads themselves (athlete_documents): the athletes table's
  // old *_url columns are never filled in, so checking them matched every
  // family. A birth certificate counts if one was uploaded or staff marked it
  // on file; a USA Wrestling card counts if it was verified (those carry over)
  // or uploaded since the newest season opened, the same rule registration uses.
  if (target.type === 'missing_document') {
    if (!target.documents.length) return []
    const [{ data: athletes }, { data: docs }, { data: season }] = await Promise.all([
      supabase.from('athletes').select('id, parent_id, birth_certificate_on_file').eq('active', true),
      supabase.from('athlete_documents').select('athlete_id, doc_type, verified, uploaded_at'),
      supabase
        .from('season_registrations')
        .select('registration_open_date')
        .order('registration_open_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    const cardWindow = season ? `${season.registration_open_date}T00:00:00.000Z` : null
    const hasBirthCertificate = new Set<string>()
    const hasCard = new Set<string>()
    for (const doc of docs ?? []) {
      if (doc.doc_type === 'birth_certificate') hasBirthCertificate.add(doc.athlete_id)
      if (doc.doc_type === 'usa_wrestling_card' && (doc.verified || !cardWindow || doc.uploaded_at >= cardWindow)) {
        hasCard.add(doc.athlete_id)
      }
    }
    const missing = (athletes ?? []).filter(
      (a) =>
        (target.documents.includes('birth_certificate') && !a.birth_certificate_on_file && !hasBirthCertificate.has(a.id)) ||
        (target.documents.includes('usa_wrestling_card') && !hasCard.has(a.id))
    )

    const parentIds = [...new Set(missing.map((a) => a.parent_id))]
    if (!parentIds.length) return []

    const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', parentIds)
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
