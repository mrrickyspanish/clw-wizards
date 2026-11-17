import { createAdminSupabase } from '@/lib/supabase/admin'
import { DEMO_FLAVOR, DEMO_MODE, demoProblems } from '@/lib/demo'

// The Homefield demo's starting state (RJ, Nov 14): a made-up club, Mohegan
// Valley, with invented families, wrestlers, coaches, sponsors, practices and
// tournaments. Birthdays all fall on January 1 of a fixed year so none is a
// real one; USA Wrestling numbers are DEMO-0001 and so on; every email ends in
// .example, which never delivers. Reset (resetDemo) wipes the demo database
// and loads this again, so the walkthrough can be recorded more than once.

export type Admin = ReturnType<typeof createAdminSupabase>

// The church reskin's logins end in sbc-demo.example (also never delivers).
export const DEMO_DOMAIN = DEMO_FLAVOR === 'church' ? 'sbc-demo.example' : 'moheganvalley.example'
export const DEMO_LOGINS = {
  parent: `parent@${DEMO_DOMAIN}`,
  admin: `admin@${DEMO_DOMAIN}`,
  staff: `staff@${DEMO_DOMAIN}`,
} as const

const SEASON = '2026-2027'
const day = (offset: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

// A tiny valid PDF, for the placeholder birth certificates and USA cards.
const PLACEHOLDER_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 28 Tf 160 400 Td (DEMO DOCUMENT - SAMPLE) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
)

export async function must<T>(label: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await p
  if (error) throw new Error(`${label}: ${error.message}`)
  return data as NonNullable<T>
}

/** Empties every table the demo fills, children before parents. */
export async function wipe(admin: Admin) {
  // Records first, then logins. A login can't be deleted while a signed waiver
  // or a verified document still points at it (Nov 17: the church reset left
  // Mohegan Valley households behind because the old order deleted logins
  // first and never checked), so every table goes before any login, and each
  // step is checked.
  const byId = async (table: string) => {
    const { error } = await admin.from(table as never).delete().not('id', 'is', null)
    if (error) throw new Error(`clearing ${table}: ${error.message}`)
  }
  for (const table of [
    'tournament_entries',
    'tournament_registrations',
    'disclosure_acceptances',
    'season_enrollments',
    'athlete_documents',
    'document_rejections',
    'dues_charges',
    'dues_payments',
    'family_guardians',
    'family_contacts',
    'family_invites',
    'athlete_guardians',
    'athletes',
    'season_price_tiers',
    'season_registrations',
    'practice_cancellations',
    'practices',
    'event_sessions',
    'club_events',
    'tournaments',
    'sponsors',
    'coaches',
    'faq_items',
    'communication_log',
    'board_copy_recipients',
    'payment_notice_recipients',
    'upload_notice_recipients',
    'disclosures',
    'content_history',
    'deletion_log',
  ]) {
    await byId(table)
  }
  for (let round = 0; round < 10; round++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) throw new Error(`listing logins: ${error.message}`)
    const users = data?.users ?? []
    if (!users.length) break
    for (const u of users) {
      const { error: delErr } = await admin.auth.admin.deleteUser(u.id)
      if (delErr) throw new Error(`removing login ${u.email ?? u.id}: ${delErr.message}`)
    }
  }
  const { data: left } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (left?.users?.length) throw new Error('Some logins from an earlier take could not be removed.')
  await admin.from('page_content').delete().not('key', 'is', null)
  // Uploaded files from earlier takes.
  for (const bucket of ['athlete-documents', 'tournament-flyers', 'comms-images']) {
    const { data: top } = await admin.storage.from(bucket).list('', { limit: 1000 })
    for (const folder of top ?? []) {
      const { data: files } = await admin.storage.from(bucket).list(folder.name, { limit: 1000 })
      const paths = (files ?? []).flatMap((f) => (f.id ? [`${folder.name}/${f.name}`] : []))
      if (folder.id) paths.push(folder.name)
      if (paths.length) await admin.storage.from(bucket).remove(paths)
    }
  }
}

export async function makeLogin(
  admin: Admin,
  password: string,
  p: { email: string; first: string; last: string; role?: 'admin'; scope?: 'full' | 'limited'; phone?: string }
) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: p.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${p.first} ${p.last}` },
  })
  if (error || !created.user) throw new Error(`login ${p.email}: ${error?.message ?? 'not created'}`)
  const id = created.user.id
  await must(
    `profile ${p.email}`,
    admin
      .from('profiles')
      .update({
        full_name: `${p.first} ${p.last}`,
        first_name: p.first,
        last_name: p.last,
        email: p.email,
        phone: p.phone ?? null,
        role: p.role ?? 'parent',
        admin_scope: p.role === 'admin' ? (p.scope ?? 'full') : null,
        is_active: true,
        onboarding_completed_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
  )
  return id
}

export type ResetResult = { ok: true; summary: string } | { ok: false; error: string }

export async function resetDemo(password: string): Promise<ResetResult> {
  if (!DEMO_MODE) return { ok: false, error: 'This is not a demo deployment.' }
  const problems = demoProblems(process.env)
  if (problems.length) return { ok: false, error: problems.join(' ') }
  if (password.length < 12) return { ok: false, error: 'The demo password must be at least 12 characters.' }
  const admin = createAdminSupabase()

  try {
    await wipe(admin)

    // Staff logins.
    const adminId = await makeLogin(admin, password, { email: DEMO_LOGINS.admin, first: 'Jordan', last: 'Avery', role: 'admin', scope: 'full' })
    await makeLogin(admin, password, { email: DEMO_LOGINS.staff, first: 'Casey', last: 'Brooks', role: 'admin', scope: 'limited' })

    // Families: new, mid-registration (the demo parent), fully registered.
    const newParent = await makeLogin(admin, password, { email: `hollins@${DEMO_DOMAIN}`, first: 'Dana', last: 'Hollins', phone: '5550100101' })
    const midParent = await makeLogin(admin, password, { email: DEMO_LOGINS.parent, first: 'Riley', last: 'Thornton', phone: '5550100102' })
    const coParent = await makeLogin(admin, password, { email: `sam.thornton@${DEMO_DOMAIN}`, first: 'Sam', last: 'Thornton', phone: '5550100103' })
    const doneParent = await makeLogin(admin, password, { email: `lindqvist@${DEMO_DOMAIN}`, first: 'Avery', last: 'Lindqvist', phone: '5550100104' })

    const wrestler = (parent: string, first: string, last: string, year: number, group: string, ageDivision: string, division = 'boys', card: string | null = null) => ({
      parent_id: parent,
      first_name: first,
      last_name: last,
      date_of_birth: `${year}-01-01`,
      practice_group: group,
      age_division: ageDivision,
      division,
      usa_wrestling_card_number: card,
      shirt_size: 'Youth M',
      active: true,
    })
    const kids = await must(
      'wrestlers',
      admin
        .from('athletes')
        .insert([
          wrestler(newParent, 'Milo', 'Hollins', 2019, 'Group 1', 'tot'),
          wrestler(midParent, 'Theo', 'Thornton', 2016, 'Group 2', 'bantam'),
          wrestler(midParent, 'Nora', 'Thornton', 2014, 'Group 3', 'intermediate', 'girls'),
          wrestler(doneParent, 'Felix', 'Lindqvist', 2013, 'Group 3', 'intermediate', 'boys', 'DEMO-0001'),
          wrestler(doneParent, 'Iris', 'Lindqvist', 2015, 'Group 2', 'bantam', 'girls', 'DEMO-0002'),
          wrestler(doneParent, 'Jonah', 'Lindqvist', 2011, 'Group 4', 'novice', 'boys', 'DEMO-0003'),
        ])
        .select('id, first_name, parent_id')
    )
    const kid = (first: string) => kids.find((k) => k.first_name === first)!.id

    // Shared guardian access: Sam sees both Thornton kids, locked by the club.
    await must('co-parent link', admin.from('family_guardians').insert({ owner_id: midParent, guardian_id: coParent, athlete_ids: [kid('Theo'), kid('Nora')], locked: true }))
    await must(
      'second-parent contact',
      admin.from('family_contacts').insert({ owner_id: doneParent, name: 'Morgan Lindqvist', email: `morgan.lindqvist@${DEMO_DOMAIN}`, athlete_ids: null, source: 'admin' })
    )

    // The season, open now.
    const [seasonEvent] = await must(
      'season event',
      admin
        .from('club_events')
        .insert({ title: `${SEASON} Season Registration`, event_type: 'season_registration', date: day(-14), location: 'Mohegan Valley Rec Center', active: true })
        .select('id')
    )
    const [season] = await must(
      'season',
      admin
        .from('season_registrations')
        .insert({
          event_id: seasonEvent.id,
          season_label: SEASON,
          registration_open_date: day(-14),
          registration_close_date: day(45),
          dues_amount_cents: 30000,
          dues_due_date: day(30),
          require_usa_card: true,
          instructions: 'Register each wrestler, sign the waiver, upload a USA Wrestling card, then pay season dues.',
        })
        .select('id')
    )
    const [waiver] = await must(
      'waiver',
      admin
        .from('disclosures')
        .insert({
          slug: 'program-waiver',
          title: 'Program Waiver',
          body: 'Sample waiver text for the Homefield demo. Wrestling is a contact sport; parents agree to the club rules, code of conduct and emergency care policy.',
          agreement_label: 'I have read and agree to the program waiver.',
          version: 1,
          required: true,
          requires_signature: true,
          active: true,
        })
        .select('id')
    )

    // Dues: one outstanding (Thornton), one paid (Lindqvist).
    const dues = await must(
      'dues',
      admin
        .from('dues_payments')
        .insert([
          { parent_id: midParent, athlete_id: kid('Theo'), amount_cents: 30000, amount_paid_cents: 0, season: SEASON, status: 'pending', due_date: day(30) },
          { parent_id: doneParent, athlete_id: kid('Felix'), amount_cents: 30000, amount_paid_cents: 30000, season: SEASON, status: 'paid', due_date: day(30) },
          { parent_id: doneParent, athlete_id: kid('Iris'), amount_cents: 30000, amount_paid_cents: 30000, season: SEASON, status: 'paid', due_date: day(30) },
          { parent_id: doneParent, athlete_id: kid('Jonah'), amount_cents: 30000, amount_paid_cents: 30000, season: SEASON, status: 'paid', due_date: day(30) },
        ])
        .select('id, athlete_id')
    )
    const duesFor = (first: string) => dues.find((d) => d.athlete_id === kid(first))!.id

    // Placeholder documents: the Lindqvists' are verified; Theo's card is missing.
    const docs: { athlete: string; parent: string; type: 'birth_certificate' | 'usa_wrestling_card'; verified: boolean }[] = [
      { athlete: 'Felix', parent: doneParent, type: 'usa_wrestling_card', verified: true },
      { athlete: 'Felix', parent: doneParent, type: 'birth_certificate', verified: true },
      { athlete: 'Iris', parent: doneParent, type: 'usa_wrestling_card', verified: true },
      { athlete: 'Jonah', parent: doneParent, type: 'usa_wrestling_card', verified: true },
      { athlete: 'Nora', parent: midParent, type: 'birth_certificate', verified: false },
    ]
    const docIds: Record<string, string> = {}
    for (const d of docs) {
      const path = `${d.parent}/${kid(d.athlete)}/${d.type}-demo.pdf`
      await admin.storage.from('athlete-documents').upload(path, PLACEHOLDER_PDF, { contentType: 'application/pdf', upsert: true })
      const [row] = await must(
        `document ${d.athlete}`,
        admin
          .from('athlete_documents')
          .insert({
            athlete_id: kid(d.athlete),
            parent_id: d.parent,
            doc_type: d.type,
            file_url: path,
            file_name: `${d.type}-demo.pdf`,
            verified: d.verified,
            verified_by: d.verified ? adminId : null,
            verified_at: d.verified ? new Date().toISOString() : null,
          })
          .select('id')
      )
      docIds[`${d.athlete}-${d.type}`] = row.id
    }

    // Enrollments: Lindqvists approved; Theo submitted (card missing); Nora not started.
    const enrollment = (first: string, parent: string, status: string, grade: string) => ({
      season_registration_id: season.id,
      athlete_id: kid(first),
      parent_id: parent,
      dues_payment_id: dues.some((d) => d.athlete_id === kid(first)) ? duesFor(first) : null,
      status,
      submitted_at: new Date().toISOString(),
      reviewed_by: status === 'approved' ? adminId : null,
      reviewed_at: status === 'approved' ? new Date().toISOString() : null,
      usa_card_document_id: docIds[`${first}-usa_wrestling_card`] ?? null,
      grade,
      school: 'Mohegan Valley Elementary',
      years_experience: '1-2 years',
    })
    await must(
      'enrollments',
      admin
        .from('season_enrollments')
        .insert([
          enrollment('Felix', doneParent, 'approved', '7th'),
          enrollment('Iris', doneParent, 'approved', '5th'),
          enrollment('Jonah', doneParent, 'approved', '9th'),
          enrollment('Theo', midParent, 'submitted', '4th'),
        ])
    )
    await must(
      'waiver signatures',
      admin.from('disclosure_acceptances').insert(
        ['Felix', 'Iris', 'Jonah', 'Theo'].map((first) => ({
          disclosure_id: waiver.id,
          season_registration_id: season.id,
          athlete_id: kid(first),
          accepted_by: first === 'Theo' ? midParent : doneParent,
          typed_signature: first === 'Theo' ? 'Riley Thornton' : 'Avery Lindqvist',
        }))
      )
    )
    await must(
      'guardians on forms',
      admin.from('athlete_guardians').insert([
        { athlete_id: kid('Theo'), ordinal: 1, name: 'Riley Thornton', relationship: 'Parent', email: DEMO_LOGINS.parent, phone: '5550100102' },
        { athlete_id: kid('Theo'), ordinal: 2, name: 'Sam Thornton', relationship: 'Parent', email: `sam.thornton@${DEMO_DOMAIN}`, phone: '5550100103', coach_interest: 'Yes' },
        { athlete_id: kid('Felix'), ordinal: 1, name: 'Avery Lindqvist', relationship: 'Parent', email: `lindqvist@${DEMO_DOMAIN}`, phone: '5550100104' },
      ])
    )

    // Practices (Mon/Wed by group) and a day off.
    const practices = await must(
      'practices',
      admin
        .from('practices')
        .insert([
          { practice_group: 'Group 1', weekday: 1, start_time: '17:30', end_time: '18:30', location: 'Mohegan Valley Rec Center', active: true },
          { practice_group: 'Group 2', weekday: 1, start_time: '18:30', end_time: '19:45', location: 'Mohegan Valley Rec Center', active: true },
          { practice_group: 'Group 3', weekday: 3, start_time: '17:30', end_time: '19:00', location: 'Mohegan Valley Rec Center', active: true },
          { practice_group: 'Group 4', weekday: 3, start_time: '19:00', end_time: '20:30', location: 'Mohegan Valley Rec Center', active: true },
        ])
        .select('id, weekday')
    )
    const nextMonday = (() => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + 7)
      return d.toISOString().slice(0, 10)
    })()
    await must(
      'day off',
      admin.from('practice_cancellations').insert(practices.filter((p) => p.weekday === 1).map((p) => ({ practice_id: p.id, date: nextMonday, reason: 'Team pictures' })))
    )
    await must(
      'club events',
      admin.from('club_events').insert([
        { title: 'Parent Meeting', event_type: 'meeting', date: day(10), start_time: '18:00', end_time: '19:00', location: 'Mohegan Valley Rec Center', active: true },
        { title: 'Team Pictures', event_type: 'other', date: nextMonday, start_time: '17:30', end_time: '19:00', location: 'Mohegan Valley Rec Center', active: true },
      ])
    )

    // Tournaments: one through an outside registration site, one on ours.
    const [classic] = await must(
      'tournaments',
      admin
        .from('tournaments')
        .insert([
          {
            name: 'Riverbend Winter Classic',
            date: day(12),
            location: 'Riverbend High School',
            city: 'Riverbend',
            state: 'IL',
            status: 'open',
            external_platform: 'trackwrestling',
            external_registration_url: `https://registration.${DEMO_DOMAIN}/riverbend-winter-classic`,
            weigh_in_date: day(11),
            weigh_in_time: '18:00',
            competition_level: 'All Levels',
            practice_groups: [],
          },
          {
            name: 'Mohegan Valley Home Duals',
            date: day(26),
            location: 'Mohegan Valley Rec Center',
            city: 'Mohegan Valley',
            state: 'IL',
            status: 'not_open',
            external_platform: null,
            external_registration_url: null,
            competition_level: 'Novice',
            practice_groups: [],
          },
        ])
        .select('id')
    )
    await must(
      'roster',
      admin.from('tournament_entries').insert([
        { tournament_id: classic.id, athlete_id: kid('Felix'), external_name: 'Felix Lindqvist (7th)', division: 'Boys 14u', weight: '96', grade: '7th', paid: true, imported_by: adminId },
        { tournament_id: classic.id, athlete_id: kid('Iris'), external_name: 'Iris Lindqvist (5th)', division: 'Girls 12u', weight: '72', grade: '5th', paid: true, imported_by: adminId },
        { tournament_id: classic.id, athlete_id: kid('Theo'), external_name: 'Theo Thornton (4th)', division: 'Boys 10u', weight: '63', grade: '4th', paid: false, imported_by: adminId },
      ])
    )

    // Coaches, FAQs, sponsors: all invented, no logos.
    await must(
      'coaches',
      admin.from('coaches').insert([
        { name: 'Pat Ferris', role: 'Head Coach', section: 'practice', sort_order: 1, active: true },
        { name: 'Lee Ostrander', role: 'Assistant Coach', section: 'practice', practice_group: 'Group 3', sort_order: 2, active: true },
        { name: 'Robin Kade', role: 'Assistant Coach', section: 'practice', practice_group: 'Group 1', sort_order: 3, active: true },
        { name: 'Jordan Avery', role: 'President', section: 'board', sort_order: 1, active: true },
        { name: 'Casey Brooks', role: 'Treasurer', section: 'board', sort_order: 2, active: true },
      ])
    )
    await must(
      'faqs',
      admin.from('faq_items').insert([
        { question: 'Who can join?', answer: 'Boys and girls from pre-K through 8th grade, any experience level.', sort_order: 1, active: true },
        { question: 'What does my wrestler need?', answer: 'Wrestling shoes, a water bottle and a USA Wrestling card. Headgear is provided for beginners.', sort_order: 2, active: true },
        { question: 'How do I pay dues?', answer: 'Log in, open Dues and pay online. Payment plans are available.', sort_order: 3, active: true },
      ])
    )
    await must(
      'sponsors',
      admin.from('sponsors').insert([
        { name: 'Falls Hardware & Supply', tier: 'platinum', industry: 'Hardware', description: 'Local hardware store (sample sponsor).', active: true },
        { name: 'Riverside Family Dental', tier: 'yellow', industry: 'Dental', description: 'Family dentistry (sample sponsor).', active: true },
        { name: 'Valley Coffee Co.', tier: 'black', industry: 'Cafe', description: 'Coffee and bakery (sample sponsor).', active: true },
        { name: 'Summit Auto Care', tier: 'white', industry: 'Auto repair', description: 'Auto repair (sample sponsor).', active: true },
      ])
    )
    await must(
      'messages',
      admin.from('communication_log').insert([
        { channel: 'email', comm_type: 'general_blast', recipient_id: doneParent, recipient_email: `lindqvist@${DEMO_DOMAIN}`, subject: 'Welcome to the new season', body_preview: 'Practice starts next week. Check your group on the calendar.', status: 'sent', sent_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { channel: 'email', comm_type: 'dues_reminder', recipient_id: midParent, recipient_email: DEMO_LOGINS.parent, subject: 'Reminder: season dues', body_preview: 'Your season dues are still open. Log in to pay online.', status: 'sent', sent_at: new Date(Date.now() - 86400000).toISOString() },
      ])
    )

    return {
      ok: true,
      summary: `Demo reset: 3 families (new, mid-registration, fully registered), ${kids.length} wrestlers, 2 staff logins, 1 season, 4 practices, 2 tournaments.`,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Reset failed.' }
  }
}
