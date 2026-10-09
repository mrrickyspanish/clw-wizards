import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

type AdminClient = ReturnType<typeof createAdminSupabase>
type WrestlerRow = { id: string; parent_id: string; first_name: string; last_name: string }

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
  if (target.type === 'missing_document') {
    if (!target.documents.length) return []
    const missing = await athletesMissingDocuments(supabase, target.documents)

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

// Active wrestlers still missing any of the given documents. Read from the
// uploads themselves (athlete_documents): the athletes table's old *_url
// columns are never filled in, so checking them matched every family. A birth
// certificate counts if one was uploaded or staff marked it on file; a USA
// Wrestling card counts if it was verified (those carry over), uploaded since
// the newest season opened (the same rule registration uses), an admin
// approved this season's registration without the card check -- the club has
// already confirmed that wrestler's membership another way -- or the
// wrestler's card number is on file, which is how the club tracks cards.
// (Every number on file was entered this season; a number carried into next
// season would also count, so the roster work planned for then should tie
// card numbers to a season.)
async function athletesMissingDocuments(supabase: AdminClient, documents: MissingDocument[]): Promise<WrestlerRow[]> {
  const [{ data: athletes }, { data: docs }, { data: season }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, parent_id, first_name, last_name, birth_certificate_on_file, usa_wrestling_card_number')
      .eq('active', true),
    supabase.from('athlete_documents').select('athlete_id, doc_type, verified, uploaded_at'),
    supabase
      .from('season_registrations')
      .select('id, registration_open_date')
      .order('registration_open_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const cardWindow = season ? `${season.registration_open_date}T00:00:00.000Z` : null
  const { data: enrollments } = season
    ? await supabase.from('season_enrollments').select('athlete_id, card_override_at').eq('season_registration_id', season.id)
    : { data: [] as { athlete_id: string; card_override_at: string | null }[] }
  const hasBirthCertificate = new Set<string>()
  const hasCard = new Set<string>()
  for (const enrollment of enrollments ?? []) {
    if (enrollment.card_override_at) hasCard.add(enrollment.athlete_id)
  }
  for (const athlete of athletes ?? []) {
    if (athlete.usa_wrestling_card_number?.trim()) hasCard.add(athlete.id)
  }
  for (const doc of docs ?? []) {
    if (doc.doc_type === 'birth_certificate') hasBirthCertificate.add(doc.athlete_id)
    if (doc.doc_type === 'usa_wrestling_card' && (doc.verified || !cardWindow || doc.uploaded_at >= cardWindow)) {
      hasCard.add(doc.athlete_id)
    }
  }
  return (athletes ?? []).filter(
    (a) =>
      (documents.includes('birth_certificate') && !a.birth_certificate_on_file && !hasBirthCertificate.has(a.id)) ||
      (documents.includes('usa_wrestling_card') && !hasCard.has(a.id))
  )
}

export type RecipientWrestler = { first_name: string; last_name: string }

/**
 * The wrestlers that put each family on a send's list, by parent id, so the
 * recipient preview can name the kids rather than the parents: the wrestler
 * missing the document, in the practice group, entered in the tournament, or
 * with dues outstanding. For "all families" and hand-picked families it is
 * every active wrestler on the account. Used for display only; who receives the
 * email is still decided by resolveRecipients.
 */
export async function recipientWrestlers(
  target: CommTarget,
  parentIds: string[]
): Promise<Map<string, RecipientWrestler[]>> {
  const byParent = new Map<string, RecipientWrestler[]>()
  if (!parentIds.length) return byParent
  const supabase = createAdminSupabase()

  const activeWrestlers = async (filter?: { ids?: string[]; groups?: string[] }) => {
    let query = supabase.from('athletes').select('id, parent_id, first_name, last_name').eq('active', true).in('parent_id', parentIds)
    if (filter?.ids) query = query.in('id', filter.ids.length ? filter.ids : ['00000000-0000-0000-0000-000000000000'])
    if (filter?.groups) query = query.in('practice_group', filter.groups)
    const { data } = await query
    return (data ?? []) as WrestlerRow[]
  }

  let wrestlers: WrestlerRow[]
  if (target.type === 'missing_document') {
    wrestlers = await athletesMissingDocuments(supabase, target.documents)
  } else if (target.type === 'practice_groups') {
    wrestlers = await activeWrestlers({ groups: target.practiceGroups })
  } else if (target.type === 'tournament_registrants') {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('athlete_id')
      .eq('tournament_id', target.tournamentId)
      .in('status', ['registered', 'confirmed'])
    wrestlers = await activeWrestlers({ ids: (data ?? []).map((r) => r.athlete_id) })
  } else if (target.type === 'outstanding_dues') {
    const { data } = await supabase
      .from('dues_payments')
      .select('athlete_id')
      .in('status', ['pending', 'partial', 'overdue'])
      .in('parent_id', parentIds)
    wrestlers = await activeWrestlers({ ids: (data ?? []).map((d) => d.athlete_id).filter((id): id is string => Boolean(id)) })
  } else {
    wrestlers = await activeWrestlers()
  }

  const wanted = new Set(parentIds)
  for (const w of wrestlers) {
    if (!wanted.has(w.parent_id)) continue
    byParent.set(w.parent_id, [...(byParent.get(w.parent_id) ?? []), { first_name: w.first_name, last_name: w.last_name }])
  }
  return byParent
}
