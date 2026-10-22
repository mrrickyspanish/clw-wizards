import { createAdminSupabase } from '@/lib/supabase/admin'
import type { FamilyContact, Profile } from '@/types/database'

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
  const owners = await accountOwners(supabase, target)
  return withCoParents(supabase, target, owners)
}

async function accountOwners(supabase: AdminClient, target: CommTarget): Promise<Profile[]> {

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
 * every active wrestler on the account. A co-parent with their own login gets
 * the wrestlers they are linked to. Used for display only; who receives the
 * email is still decided by resolveRecipients.
 */
export async function recipientWrestlers(
  target: CommTarget,
  parentIds: string[]
): Promise<Map<string, RecipientWrestler[]>> {
  const rows = await recipientWrestlerRows(target, parentIds)
  return new Map(
    [...rows].map(([id, kids]) => [id, kids.map((k) => ({ first_name: k.first_name, last_name: k.last_name }))])
  )
}

/** recipientWrestlers with each wrestler's id, for counting and matching. */
export async function recipientWrestlerRows(target: CommTarget, profileIds: string[]): Promise<Map<string, WrestlerRow[]>> {
  const byProfile = new Map<string, WrestlerRow[]>()
  if (!profileIds.length) return byProfile
  const supabase = createAdminSupabase()

  const { data: linkRows } = await supabase
    .from('family_guardians')
    .select('owner_id, guardian_id, athlete_ids')
    .in('guardian_id', profileIds)
  const links = (linkRows ?? []) as CoParentLinkRow[]
  const ownerIds = [...new Set([...profileIds, ...links.map((l) => l.owner_id)])]
  const wrestlers = await wrestlersOnTarget(supabase, target, ownerIds)

  const add = (profileId: string, w: WrestlerRow) => {
    const list = byProfile.get(profileId) ?? []
    if (!list.some((k) => k.id === w.id)) byProfile.set(profileId, [...list, w])
  }
  const wanted = new Set(profileIds)
  for (const w of wrestlers) {
    if (wanted.has(w.parent_id)) add(w.parent_id, w)
  }
  for (const link of links) {
    for (const w of wrestlers) {
      if (w.parent_id === link.owner_id && coversWrestler(link, w.id)) add(link.guardian_id, w)
    }
  }
  return byProfile
}

type CoParentLinkRow = { owner_id: string; guardian_id: string; athlete_ids: string[] | null }

function coversWrestler(link: { athlete_ids: string[] | null }, athleteId: string): boolean {
  return link.athlete_ids === null || link.athlete_ids.includes(athleteId)
}

// Active wrestlers on these accounts that put the family on the send's list.
async function wrestlersOnTarget(supabase: AdminClient, target: CommTarget, parentIds: string[]): Promise<WrestlerRow[]> {
  if (!parentIds.length) return []
  const activeWrestlers = async (filter?: { ids?: string[]; groups?: string[] }) => {
    let query = supabase.from('athletes').select('id, parent_id, first_name, last_name').eq('active', true).in('parent_id', parentIds)
    if (filter?.ids) query = query.in('id', filter.ids.length ? filter.ids : ['00000000-0000-0000-0000-000000000000'])
    if (filter?.groups) query = query.in('practice_group', filter.groups)
    const { data } = await query
    return (data ?? []) as WrestlerRow[]
  }

  if (target.type === 'missing_document') {
    const wanted = new Set(parentIds)
    return (await athletesMissingDocuments(supabase, target.documents)).filter((w) => wanted.has(w.parent_id))
  }
  if (target.type === 'practice_groups') return activeWrestlers({ groups: target.practiceGroups })
  if (target.type === 'tournament_registrants') {
    const { data } = await supabase
      .from('tournament_registrations')
      .select('athlete_id')
      .eq('tournament_id', target.tournamentId)
      .in('status', ['registered', 'confirmed'])
    return activeWrestlers({ ids: (data ?? []).map((r) => r.athlete_id) })
  }
  if (target.type === 'outstanding_dues') {
    const { data } = await supabase
      .from('dues_payments')
      .select('athlete_id')
      .in('status', ['pending', 'partial', 'overdue'])
      .in('parent_id', parentIds)
    return activeWrestlers({ ids: (data ?? []).map((d) => d.athlete_id).filter((id): id is string => Boolean(id)) })
  }
  return activeWrestlers()
}

/**
 * Co-parents with their own login get what the family gets. "All families"
 * already includes them (they are parent accounts); every other send is
 * resolved through the owner's wrestlers, so without this a co-parent missed
 * practice group, dues and missing-document sends. A link limited to some
 * wrestlers counts only when one of those put the family on the list.
 * Hand-picked families get exactly the accounts picked: a co-parent is their
 * own account in the picker, and a message picked for one parent can be
 * private to them.
 */
async function withCoParents(supabase: AdminClient, target: CommTarget, owners: Profile[]): Promise<Profile[]> {
  if (target.type === 'all' || target.type === 'custom' || !owners.length) return owners
  const { data: linkRows } = await supabase
    .from('family_guardians')
    .select('owner_id, guardian_id, athlete_ids')
    .in('owner_id', owners.map((o) => o.id))
  const links = (linkRows ?? []) as CoParentLinkRow[]
  if (!links.length) return owners

  const wrestlers = await wrestlersOnTarget(supabase, target, [...new Set(links.map((l) => l.owner_id))])
  const keep = links.filter(
    (l) => l.athlete_ids === null || wrestlers.some((w) => w.parent_id === l.owner_id && coversWrestler(l, w.id))
  )
  const have = new Set(owners.map((o) => o.id))
  const guardianIds = [...new Set(keep.map((l) => l.guardian_id))].filter((id) => !have.has(id))
  if (!guardianIds.length) return owners
  const { data } = await supabase.from('profiles').select('*').eq('is_active', true).in('id', guardianIds)
  return [...owners, ...((data ?? []) as Profile[])]
}

export type ContactRecipient = { ownerId: string; name: string | null; email: string }

/**
 * Family contacts (Profile -> "Also send club emails to") who get this send:
 * the second parent from the registration form, or anyone the family or an
 * admin added. A contact listed for some wrestlers only gets sends about those
 * wrestlers. Each address gets one copy: one already on the send as an account,
 * or listed by two families, is skipped. Email only; nothing texts a contact.
 */
export async function familyContactRecipients(target: CommTarget, profiles: Profile[]): Promise<ContactRecipient[]> {
  if (!profiles.length) return []
  const supabase = createAdminSupabase()
  const { data } = await supabase
    .from('family_contacts')
    .select('owner_id, name, email, athlete_ids')
    .in('owner_id', profiles.map((p) => p.id))
    .is('removed_at', null)
    .not('email', 'is', null)
  const contacts = (data ?? []) as Pick<FamilyContact, 'owner_id' | 'name' | 'email' | 'athlete_ids'>[]
  if (!contacts.length) return []

  const scoped = contacts.some((c) => c.athlete_ids !== null)
  const wrestlers = scoped ? await recipientWrestlerRows(target, profiles.map((p) => p.id)) : new Map<string, WrestlerRow[]>()
  const taken = new Set(profiles.flatMap((p) => (p.email ? [p.email.trim().toLowerCase()] : [])))
  const out: ContactRecipient[] = []
  for (const c of contacts) {
    const email = c.email?.trim().toLowerCase()
    if (!email || taken.has(email)) continue
    if (c.athlete_ids !== null) {
      const ids = c.athlete_ids
      if (!(wrestlers.get(c.owner_id) ?? []).some((w) => ids.includes(w.id))) continue
    }
    taken.add(email)
    out.push({ ownerId: c.owner_id, name: c.name, email })
  }
  return out
}
