import type { SupabaseClient } from '@supabase/supabase-js'
import type { AthleteDocument, Database } from '@/types/database'

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
