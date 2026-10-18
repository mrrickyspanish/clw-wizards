import type { SupabaseClient } from '@supabase/supabase-js'
import type { AthleteDocument, Database, DocumentRejection } from '@/types/database'

// The To review queue: USA cards and birth certificates a family uploaded that
// nobody has verified yet, for wrestlers still active. Rejecting an upload
// removes it (see document_rejections), so the queue is simply "not verified".
// The page and the menu count both read it here, so they always agree.

export const REVIEWABLE_DOC_TYPES = ['usa_wrestling_card', 'birth_certificate'] as const

export type QueueDocument = Pick<
  AthleteDocument,
  'id' | 'athlete_id' | 'parent_id' | 'doc_type' | 'file_name' | 'uploaded_at'
>

export async function reviewQueue(supabase: SupabaseClient<Database>): Promise<QueueDocument[]> {
  const { data: docs } = await supabase
    .from('athlete_documents')
    .select('id, athlete_id, parent_id, doc_type, file_name, uploaded_at')
    .eq('verified', false)
    .in('doc_type', [...REVIEWABLE_DOC_TYPES])
    .order('uploaded_at', { ascending: false })
  const rows = (docs ?? []) as QueueDocument[]
  if (!rows.length) return []
  const { data: active } = await supabase
    .from('athletes')
    .select('id')
    .eq('active', true)
    .in('id', [...new Set(rows.map((d) => d.athlete_id))])
  const activeIds = new Set((active ?? []).map((a) => a.id))
  return rows.filter((d) => activeIds.has(d.athlete_id))
}

export type LatestRejection = Pick<DocumentRejection, 'athlete_id' | 'doc_type' | 'reason' | 'rejected_at'>

/**
 * The club's latest rejection per wrestler and document, keyed
 * `${athlete_id}:${doc_type}`. Pages show it where the document now reads as
 * missing, so an admin can see why ("Rejected Oct 18: hard to read").
 */
export async function latestRejections(
  supabase: SupabaseClient<Database>,
  athleteIds: string[]
): Promise<Map<string, LatestRejection>> {
  const byKey = new Map<string, LatestRejection>()
  if (!athleteIds.length) return byKey
  const { data } = await supabase
    .from('document_rejections')
    .select('athlete_id, doc_type, reason, rejected_at')
    .in('athlete_id', athleteIds)
    .order('rejected_at', { ascending: false })
  for (const row of (data ?? []) as LatestRejection[]) {
    const key = `${row.athlete_id}:${row.doc_type}`
    if (!byKey.has(key)) byKey.set(key, row)
  }
  return byKey
}

export function rejectionLine(rejection: LatestRejection): string {
  const day = new Date(rejection.rejected_at).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
  })
  return `Rejected ${day}: ${rejection.reason} Waiting on a new upload.`
}
