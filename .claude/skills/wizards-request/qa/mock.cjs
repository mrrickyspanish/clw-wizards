/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS QA script, run with plain node. */
// QA mock of the Supabase REST + auth API with synthetic (fake) club data.
// Usage: node mock.cjs <port> <as: admin|parent>
const http = require('http')
const uploads = {}
// A made-up flier picture (a gold 300x400 SVG) for the tournament flier view.
uploads['tournament-flyers/flyers/qa-flier.svg'] = { type: 'image/svg+xml', body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#F0C020"/><text x="150" y="200" font-size="28" text-anchor="middle" font-family="sans-serif">QA FLIER</text></svg>') }
const { URL } = require('url')
const port = Number(process.argv[2] || 54329)
let as = process.argv[3] || 'admin'

const T = '2026-10-01T15:00:00Z'
const id = (p, n) => `00000000-0000-4000-8000-${p.charCodeAt(0).toString(16)}${String(n).padStart(10, '0')}`
const ADMIN = id('a', 1)
const PARENT = id('b', 1)
const PARENT2 = id('b', 2)
const PARENT3 = id('b', 3)
const SEASON_EVENT = id('e', 1)
const SPLIT_EVENT = id('e', 2)
const SEASON = id('c', 1)
const DISC = id('d', 1)

const base = { created_at: T, updated_at: T }
const profile = (pid, full_name, email, extra = {}) => ({
  ...base, id: pid, full_name, first_name: full_name.split(' ')[0], last_name: full_name.split(' ').slice(1).join(' '),
  email, role: 'parent', admin_scope: null, phone: '8155550100', practice_group: null, sms_opt_in: true,
  sms_opt_in_at: T, consent_text: 'x', street_address: '1 Main St', city: 'Crystal Lake', state: 'IL', postal_code: '60014',
  email_unsubscribe_token: id('f', 9), is_active: true, is_coach: false, onboarding_completed_at: T, ...extra,
})
const tables = {
  profiles: [
    profile(ADMIN, 'Coach Test', 'coach@example.com', { role: 'admin', admin_scope: 'full' }),
    profile(id('a', 2), 'Alexandra Longname-Example', 'alexandra.long.address@example.com', { role: 'admin', admin_scope: 'full' }),
    profile(id('a', 3), 'Lim Ited', 'limited@example.com', { role: 'admin', admin_scope: 'limited' }),
    profile(id('a', 4), 'Gone Admin', 'gone@example.com', { role: 'admin', admin_scope: 'limited', is_active: false }),
    profile(PARENT, 'Pat Parent', 'pat@example.com'),
    profile(PARENT2, 'Sam Sample', 'sam@example.com', { sms_opt_in: false }),
    profile(PARENT3, 'Robin Roe', 'robin@example.com', { created_at: '2026-10-05T12:00:00Z', is_coach: true }),
    // A co-parent with no wrestlers of their own, linked (club-locked) to one of Pat Parent's kids.
    profile(id('b', 4), 'Casey Coparent', 'casey@example.com', { created_at: '2026-10-13T12:00:00Z' }),
  ],
  athletes: [
    ['Tommy', 'Parent', '2018-01-08', PARENT, null],
    ['Tina', 'Parent', '2020-05-02', PARENT, null],
    ['Max', 'Sample', '2015-03-03', PARENT2, 'senior'],
    ['Lily', 'Sample', '2013-09-09', PARENT2, null],
    ['Owen', 'Roe', '2016-06-06', PARENT3, null],
    // A long name, for layouts that have to wrap it.
    ['Maximiliano-Alexander', 'Vandenberghe-Fontaine', '2014-02-02', PARENT3, null],
  ].map(([first_name, last_name, date_of_birth, parent_id, age_division], i) => ({
    ...base, id: id('k', i + 1), parent_id, first_name, last_name, date_of_birth, weight_class: '60', practice_group: i % 2 ? 'Group 2' : 'Group 1',
    division: i === 1 || i === 3 ? 'girls' : 'boys', age_division, usa_wrestling_card_number: null, shirt_size: 'Youth M',
    referral_source: 'Friend', birth_certificate_url: null, usa_wrestling_card_url: null, birth_certificate_on_file: i === 2,
    birth_certificate_on_file_by: null, birth_certificate_on_file_at: null, active: true,
    created_at: i === 4 ? '2026-10-05T12:00:00Z' : '2026-08-21T12:00:00Z',
  })),
  club_events: [
    { ...base, id: SEASON_EVENT, title: 'Wizards 26-27 Season', event_type: 'season_registration', date: '2026-10-16', start_time: null, end_time: null, location: 'Wizards Facility', notes: null, practice_group: null, active: true },
    { ...base, id: SPLIT_EVENT, title: 'Picture Day', event_type: 'event', date: '2026-11-14', start_time: '09:00', end_time: '12:00', location: 'Wizards Facility', notes: 'Wear your singlet.', practice_group: null, active: true },
    { ...base, id: id('e', 3), title: 'Hidden Planning Meeting', event_type: 'meeting', date: '2026-11-20', start_time: '18:00', end_time: null, location: 'TBD', notes: null, practice_group: null, active: false },
  ],
  event_sessions: [
    { id: id('s', 1), event_id: SPLIT_EVENT, start_time: '09:00', end_time: '10:30', age_divisions: ['tot', 'bantam'], sort_order: 0, created_at: T },
    { id: id('s', 2), event_id: SPLIT_EVENT, start_time: '10:30', end_time: '12:00', age_divisions: ['intermediate', 'novice', 'senior'], sort_order: 1, created_at: T },
  ],
  season_registrations: [
    { ...base, id: SEASON, event_id: SEASON_EVENT, season_label: '2026-27 Wizards Season Registration', registration_open_date: '2026-08-01', registration_close_date: '2026-10-16', dues_amount_cents: 35000, dues_due_date: '2026-10-16', instructions: null, require_usa_card: true },
  ],
  season_price_tiers: [],
  disclosures: [{ ...base, id: DISC, slug: 'waiver', title: 'Waiver', body: 'Waiver text', agreement_label: 'I agree', version: 1, required: true, requires_signature: true, active: true }],
  dues_payments: [],
  season_enrollments: [],
  disclosure_acceptances: [],
  // Registration form answers: Robin and Rae Roe said yes to coaching (both ticked
  // Coach), Jordan said yes but isn't ticked yet, Pat said no.
  athlete_guardians: [
    { id: id('h', 1), athlete_id: id('k', 5), name: 'Robin Roe', email: 'robin@example.com', coach_interest: 'Yes', created_at: T },
    { id: id('h', 2), athlete_id: id('k', 5), name: 'Rae Roe', email: 'rae@example.com', coach_interest: 'Yes', created_at: T },
    { id: id('h', 3), athlete_id: id('k', 1), name: 'Jordan Second-Parent', email: 'jordan.second.parent.with.a.long.address@example.com', coach_interest: 'Yes', created_at: T },
    { id: id('h', 4), athlete_id: id('k', 1), name: 'Pat Parent', email: 'pat@example.com', coach_interest: 'No', created_at: T },
  ],
  athlete_documents: [
    { id: id('d', 3), athlete_id: id('k', 6), parent_id: PARENT3, doc_type: 'usa_wrestling_card', file_name: 'IMG_20261018_093412_USA_Wrestling_membership_card_front_and_back_scan.jpeg', file_url: PARENT3 + '/' + id('k', 6) + '/usa_wrestling_card-3-card.jpeg', verified: false, verified_by: null, verified_at: null, uploaded_at: '2026-10-18T14:30:00Z', ...base },
    { id: id('d', 2), athlete_id: id('k', 2), parent_id: PARENT, doc_type: 'usa_wrestling_card', file_url: PARENT + '/' + id('k', 2) + '/usa_wrestling_card-1-card.png', file_name: 'card.png', verified: false, verified_by: null, verified_at: null, uploaded_at: '2026-10-02T15:00:00Z' },
    { id: id('d', 1), athlete_id: id('k', 1), parent_id: PARENT, doc_type: 'birth_certificate', file_url: PARENT + '/' + id('k', 1) + '/birth_certificate-1-bc.pdf', file_name: 'bc.pdf', verified: false, verified_by: null, verified_at: null, uploaded_at: '2026-10-10T15:00:00Z', created_at: T },
  ],
  practices: [[1, 'Group 1', '17:30', '18:30'], [1, 'Group 3', '19:00', '20:30'], [2, 'Group 2', '17:30', '18:45'], [2, 'Group 4', '19:00', '20:30'], [3, 'Group 3', '17:30', '18:45'], [4, 'Group 1', '17:30', '18:30'], [5, 'Group 2', '17:30', '18:45']]
    .map(([weekday, practice_group, start_time, end_time], i) => ({ ...base, id: id('p', i + 1), weekday, practice_group, start_time, end_time, location: 'Wizards Facility', notes: null, active: true, starts_on: '2026-11-01', ends_on: '2027-03-15' })),
  // A whole day off with a reason, one group off on another day.
  practice_cancellations: [
    { id: id('v', 1), practice_id: id('p', 6), date: '2026-11-05', reason: 'Team pictures', created_at: T },
    { id: id('v', 2), practice_id: id('p', 2), date: '2026-11-09', reason: null, created_at: T },
  ],
  tournaments: [
    { ...base, id: id('t', 1), name: 'Turkey Tussle Open With A Long Tournament Name', date: '2026-11-21', start_time: '8:00 AM', location: 'Central High School', city: 'Huntley', state: 'IL', status: 'open', external_registration_url: 'https://example.com/register', competition_level: 'Novice', weigh_in_date: '2026-11-20', weigh_in_time: '18:00', weigh_in_location: 'Central High School', practice_groups: [], notes: 'Singlets required.', external_platform: 'TrackWrestling', image_url: 'http://127.0.0.1:54329/storage/v1/object/public/tournament-flyers/flyers/qa-flier.svg' },
    { ...base, id: id('t', 2), name: 'Holiday Duals', date: '2026-12-05', start_time: null, location: '', city: 'Crystal Lake', state: 'IL', status: 'closed', external_registration_url: null, competition_level: null, weigh_in_date: null, weigh_in_location: null, practice_groups: [], notes: null, external_platform: null, image_url: 'https://example.com/holiday-duals.pdf' },
  ],
  tournament_registrations: [],
  communication_log: [
    { id: id('l', 1), channel: 'email', comm_type: 'custom', recipient_id: PARENT, recipient_email: 'pat@example.com', recipient_phone: null, tournament_id: null, subject: 'Practice starts Nov 2', body_preview: 'See you there', status: 'sent', sent_at: '2026-10-05T14:00:00Z', external_id: null, blast_id: id('z', 1) },
  ],
  payment_notice_recipients: [{ id: id('y', 1), name: 'Terry Coach', email: 'terry@example.com', created_at: T }, { id: id('y', 2), name: 'Sam Staffer', email: 'sam.staffer@example.com', created_at: T }],
  board_copy_recipients: [{ id: id('r', 1), name: 'Board Member', email: 'board@example.com', created_at: T }],
  deletion_log: [
    { id: id('x', 1), deleted_at: '2026-10-09T15:00:00Z', kind: 'family', profile_id: id('b', 7), family_name: 'Dana Gone', family_email: 'dana@example.com', wrestlers: [{ name: 'Sky Gone', dob: '2015-01-01', registered: true, status: 'submitted' }], had_registration: true, deleted_by: ADMIN, deleted_by_name: 'Coach Test', via: 'site', note: null },
    { id: id('x', 2), deleted_at: '2026-10-09T12:00:00Z', kind: 'family', profile_id: null, family_name: 'Old Family', family_email: 'old@example.com', wrestlers: [{ name: 'Kid Old', dob: '2016-01-01', registered: false, status: null }], had_registration: false, deleted_by: null, deleted_by_name: null, via: 'unknown', note: 'Removed between Oct 3 and Oct 9, 2026, before this record existed.' },
  ],
  request_log: [
    { id: id('w', 1), received_at: '2026-10-13T16:03:00Z', from_name: 'Terry', title: 'Add Google Form sign-ups: Kid One, Kid Two', outcome: 'Both added and registered ($325 dues each).', status: 'done', waiting_on: null, people: ['Kid One', 'Kid Two'], handled_at: T, updated_at: T },
    { id: id('w', 2), received_at: '2026-10-12T02:02:00Z', from_name: 'Terry', title: 'Parent says dues are paid', outcome: 'No online payment on record. Asked Terry whether it was paid offline.', status: 'waiting', waiting_on: 'Terry: confirm how the parent paid', people: ['Pat Parent'], handled_at: T, updated_at: T },
  ],
  // Tina's birth certificate was rejected; she has no newer upload, so Documents asks for a new one.
  document_rejections: [{ id: id('r', 2), athlete_id: id('k', 4), parent_id: PARENT2, doc_type: 'usa_wrestling_card', reason: 'This card is expired. Please upload the current season card.', file_name: 'old.png', file_url: 'x', uploaded_at: T, rejected_by: ADMIN, rejected_at: '2026-10-18T16:00:00Z' }, { id: id('r', 1), athlete_id: id('k', 2), parent_id: PARENT, doc_type: 'birth_certificate', reason: 'Hard to read. Please upload a clearer photo.', file_name: 'blurry.jpg', file_url: 'x', uploaded_at: T, rejected_by: ADMIN, rejected_at: '2026-10-18T15:00:00Z' }],
  upload_notice_recipients: [{ id: id('u', 1), name: 'Terry Coach', email: 'terry@example.com', created_at: T }],
  // Second parents and others who get a family's emails: a long address, one
  // listed for one wrestler only, and a family at the limit of three.
  family_contacts: [
    { ...base, id: id('f', 1), owner_id: PARENT, name: 'Jordan Second-Parent', email: 'jordan.second.parent.with.a.long.address@example.com', phone: '8155550100', athlete_ids: null, source: 'form', removed_at: null, is_coach: false },
    { ...base, id: id('f', 2), owner_id: PARENT, name: 'Grandma Parent', email: 'grandma@example.com', phone: null, athlete_ids: [id('k', 1)], source: 'form', removed_at: null, is_coach: false },
    { ...base, id: id('f', 3), owner_id: PARENT3, name: 'Rae Roe', email: 'rae@example.com', phone: null, athlete_ids: null, source: 'family', removed_at: null, is_coach: true },
    { ...base, id: id('f', 4), owner_id: PARENT3, name: 'Grandpa Roe', email: null, phone: '8155550111', athlete_ids: null, source: 'admin', removed_at: null, is_coach: false },
    { ...base, id: id('f', 5), owner_id: PARENT3, name: 'Aunt Vandenberghe-Fontaine', email: 'aunt.vandenberghe.fontaine@example.com', phone: null, athlete_ids: [id('k', 6)], source: 'form', removed_at: null, is_coach: false },
    { ...base, id: id('f', 6), owner_id: PARENT3, name: 'Removed Person', email: 'removed@example.com', phone: null, athlete_ids: null, source: 'form', removed_at: T, is_coach: false },
  ],
  family_guardians: [{ id: id('g', 1), owner_id: PARENT, guardian_id: id('b', 4), athlete_ids: [id('k', 1)], locked: true, created_at: T }], family_invites: [], coaches: [], admin_invites: [], sponsors: [], sponsor_tiers: [], donations: [],
  faq_items: [], page_content: [], parent_auth_incidents: [],
}
// Registrations: Tommy approved & paid, Max submitted (card cleared), Lily submitted, Tina and Owen not registered.
const enroll = (n, kid, parent, status, paid, extra = {}) => {
  const dues = { ...base, id: id('m', n), parent_id: parent, athlete_id: kid, amount_cents: 35000, amount_paid_cents: paid, season: '2026-27 Wizards Season Registration', status: paid >= 35000 ? 'paid' : 'pending', stripe_payment_intent_id: null, stripe_checkout_session_id: null, payment_plan: false, waived_by: null, waived_at: null, waived_note: null, due_date: '2026-10-16' }
  tables.dues_payments.push(dues)
  tables.season_enrollments.push({ ...base, id: id('n', n), season_registration_id: SEASON, athlete_id: kid, parent_id: parent, dues_payment_id: dues.id, usa_card_document_id: null, status, submitted_at: '2026-09-01T12:00:00Z', reviewed_by: null, reviewed_at: null, admin_note: null, card_override_by: null, card_override_at: null, card_override_note: null, grade: '3rd', school: 'North', weight_lbs: 60, shirt_size: 'Youth M', years_experience: '1', season_commitment: 'N/A', ...extra })
  tables.disclosure_acceptances.push({ id: id('q', n), disclosure_id: DISC, season_registration_id: SEASON, athlete_id: kid, accepted_by: parent, accepted_at: T, typed_signature: 'Sig', ip_address: null, user_agent: null, created_at: T })
}
enroll(1, id('k', 1), PARENT, 'approved', 35000, { card_override_at: T, card_override_by: ADMIN })
enroll(2, id('k', 3), PARENT2, 'submitted', 0, { card_override_at: T, card_override_by: ADMIN })
enroll(3, id('k', 4), PARENT2, 'submitted', 10000)
enroll(4, id('k', 2), PARENT, 'submitted', 0)
// Tina's dues are on a payment plan with $50 paid, so the Pay another amount box shows.
Object.assign(tables.dues_payments.find((d) => d.id === id('m', 4)), { payment_plan: true, amount_paid_cents: 5000, status: 'partial' })
// A one-day session for two groups with a note, like Tony's regional week.
for (const [n, group] of [[20, 'Group 2'], [21, 'Group 3']]) tables.practices.push({ ...base, id: id('p', n), weekday: 2, practice_group: group, start_time: '18:00', end_time: '19:30', location: 'Wizards Facility', notes: 'Regional wrestlers', active: true, starts_on: '2026-11-10', ends_on: '2026-11-10' })
tables.athletes.find((a) => a.first_name === 'Tina').usa_wrestling_card_number = '1234567890'
tables.athletes.find((a) => a.first_name === 'Lily').usa_wrestling_card_number = '5550001112'

const user = () => {
  const uid = as === 'admin' ? ADMIN : PARENT
  const email = as === 'admin' ? 'coach@example.com' : 'pat@example.com'
  return { id: uid, aud: 'authenticated', role: 'authenticated', email, email_confirmed_at: T, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: T, updated_at: T }
}

function parseIn(v) { return v.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, '')) }
function match(row, key, expr) {
  const neg = expr.startsWith('not.')
  if (neg) expr = expr.slice(4)
  const dot = expr.indexOf('.')
  const op = expr.slice(0, dot)
  const val = expr.slice(dot + 1)
  const cell = row[key]
  let ok
  switch (op) {
    case 'eq': ok = String(cell) === val; break
    case 'neq': ok = String(cell) !== val; break
    case 'gt': ok = cell != null && String(cell) > val; break
    case 'gte': ok = cell != null && String(cell) >= val; break
    case 'lt': ok = cell != null && String(cell) < val; break
    case 'lte': ok = cell != null && String(cell) <= val; break
    case 'in': ok = parseIn(val).includes(String(cell)); break
    case 'is': ok = val === 'null' ? cell == null : String(cell) === val; break
    case 'ilike': case 'like': { const re = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/%/g, '.*') + '$', 'i'); ok = re.test(String(cell ?? '')); break }
    case 'cs': ok = Array.isArray(cell) && parseIn(val.replace(/^\{|\}$/g, '')).every((v) => cell.includes(v)); break
    case 'ov': ok = Array.isArray(cell) && parseIn(val.replace(/^\{|\}$/g, '')).some((v) => cell.includes(v)); break
    default: ok = true
  }
  return neg ? !ok : ok
}
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])
const unknown = new Set()
const writes = []
const saved = {}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const raw = Buffer.concat(chunks)
    const body = raw.toString()
    res.setHeader('content-type', 'application/json')
    res.setHeader('access-control-allow-origin', req.headers.origin || '*')
    res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers'] || '*')
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end() }
    if (u.pathname === '/__as') { as = u.searchParams.get('who'); return res.end('{}') }
    if (u.pathname === '/__unknown') return res.end(JSON.stringify([...unknown]))
    if (u.pathname.startsWith('/auth/v1/user')) return res.end(JSON.stringify(user()))
    // One login by id (Families: last logged in). Casey Coparent has never logged in.
    const oneUser = /^\/auth\/v1\/admin\/users\/([^/]+)$/.exec(u.pathname)
    if (oneUser && req.method === 'GET') {
      const p = tables.profiles.find((r) => r.id === oneUser[1])
      if (!p) { res.statusCode = 404; return res.end(JSON.stringify({ code: 404, msg: 'User not found' })) }
      return res.end(JSON.stringify({ id: p.id, aud: 'authenticated', email: p.email, last_sign_in_at: p.id === id('b', 4) ? null : '2026-10-25T17:04:00Z' }))
    }
    // Add parent login: a new login gets a parent profile, as the sign-up trigger does.
    if (u.pathname === '/auth/v1/admin/users' && req.method === 'POST') {
      const input = JSON.parse(body || '{}')
      if (tables.profiles.some((r) => r.email === input.email)) { res.statusCode = 422; return res.end(JSON.stringify({ code: 422, msg: 'A user with this email address has already been registered' })) }
      const nid = id('n', 900 + tables.profiles.length)
      tables.profiles.push(profile(nid, input.user_metadata?.full_name || input.email, input.email, { onboarding_completed_at: null, sms_opt_in: false, phone: null }))
      return res.end(JSON.stringify({ id: nid, aud: 'authenticated', email: input.email, last_sign_in_at: null }))
    }
    if (u.pathname.startsWith('/auth/v1/admin/users')) return res.end(JSON.stringify({ users: [user()], aud: 'authenticated' }))
    if (u.pathname.startsWith('/auth/v1/')) return res.end('{}')
    if (req.method !== 'GET' && req.method !== 'HEAD') writes.push({ method: req.method, path: u.pathname + u.search, body: body.slice(0, 400) })
    if (u.pathname === '/__writes') return res.end(JSON.stringify(writes))
    // /__clear?table=athlete_documents empties a table, e.g. to see an empty state.
    if (u.pathname === '/__clear') { const t = u.searchParams.get('table'); if (t in tables) { saved[t] = saved[t] ?? tables[t]; tables[t] = [] } return res.end('{}') }
    if (u.pathname === '/__restore') { for (const t of Object.keys(saved)) tables[t] = saved[t]; return res.end('{}') }
    if (u.pathname.startsWith('/storage/v1/object/upload/sign/') && req.method === 'POST') { const p = u.pathname.replace('/storage/v1/object/upload/sign/', ''); return res.end(JSON.stringify({ url: `/object/upload/sign/${p}?token=uptok` })) }
    if (u.pathname.startsWith('/storage/v1/object/upload/sign/') && req.method === 'PUT') {
      // Keep the bytes so a public picture (Communications emails) can be shown back.
      // supabase-js sends a File as multipart form data: keep just the file part.
      let file = { type: req.headers['content-type'], body: raw }
      const boundary = /boundary=(.+)$/.exec(req.headers['content-type'] || '')?.[1]
      if (boundary) {
        const text = raw.toString('latin1')
        const part = text.split('--' + boundary).find((p) => /content-type:\s*image\//i.test(p))
        if (part) {
          const start = part.indexOf('\r\n\r\n') + 4
          file = { type: /content-type:\s*([^\r\n]+)/i.exec(part)[1], body: Buffer.from(part.slice(start, part.length - 2), 'latin1') }
        }
      }
      uploads[u.pathname.replace('/storage/v1/object/upload/sign/', '')] = file
      return res.end(JSON.stringify({ Key: u.pathname }))
    }
    if (u.pathname.startsWith('/storage/v1/object/public/')) {
      const file = uploads[u.pathname.replace('/storage/v1/object/public/', '')]
      if (!file) { res.statusCode = 404; return res.end('{}') }
      res.setHeader('content-type', file.type || 'application/octet-stream')
      return res.end(file.body)
    }
    if (u.pathname.startsWith('/storage/v1/object/sign/') && req.method === 'GET') {
      res.setHeader('access-control-allow-origin', '*')
      const dl = u.searchParams.get('download')
      res.setHeader('content-type', 'application/pdf')
      if (dl !== null) res.setHeader('content-disposition', `attachment; filename="${dl || 'file.pdf'}"`)
      return res.end('%PDF-1.4 mock')
    }
    if (u.pathname.startsWith('/storage/v1/object/sign/')) { res.setHeader('content-type','application/json'); return res.end(JSON.stringify({ signedURL: '/object/sign/athlete-documents/bc.pdf?token=t' })) }
    if (u.pathname.startsWith('/storage/')) return res.end('[]')
    const rpc = u.pathname.match(/^\/rest\/v1\/rpc\/(\w+)/)
    if (rpc) {
      const fn = rpc[1]
      const yes = ['has_role', 'manages_athlete', 'guards_athlete', 'is_full_admin']
      return res.end(JSON.stringify(yes.includes(fn) ? (fn === 'has_role' ? as === 'admin' : true) : fn === 'family_link_names' ? [] : null))
    }
    const m = u.pathname.match(/^\/rest\/v1\/(\w+)/)
    if (!m) { res.statusCode = 404; return res.end('{}') }
    const table = m[1]
    if (!(table in tables)) { unknown.add(table); tables[table] = [] }
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.end(body && body.trim().startsWith('[') ? body : body ? `[${body}]` : '[]')
    let rows = tables[table].filter((row) => {
      for (const [k, v] of u.searchParams) {
        if (RESERVED.has(k)) continue
        if (k === 'or' || k === 'and') continue
        if (!match(row, k, v)) return false
      }
      return true
    })
    const order = u.searchParams.get('order')
    if (order) {
      const [col, dir] = order.split(',')[0].split('.')
      rows = [...rows].sort((a, b) => (String(a[col] ?? '') < String(b[col] ?? '') ? -1 : String(a[col] ?? '') > String(b[col] ?? '') ? 1 : 0) * (dir === 'desc' ? -1 : 1))
    }
    const total = rows.length
    const limit = u.searchParams.get('limit')
    if (limit) rows = rows.slice(0, Number(limit))
    if ((req.headers.prefer || '').includes('count=')) res.setHeader('content-range', `0-${Math.max(total - 1, 0)}/${total}`)
    if ((req.headers.accept || '').includes('vnd.pgrst.object')) {
      if (!rows.length) { res.statusCode = 406; return res.end(JSON.stringify({ code: 'PGRST116', message: 'no rows', details: '', hint: '' })) }
      return res.end(JSON.stringify(rows[0]))
    }
    res.end(req.method === 'HEAD' ? '' : JSON.stringify(rows))
  })
}).listen(port, '127.0.0.1', () => console.log('mock on', port, 'as', as))
