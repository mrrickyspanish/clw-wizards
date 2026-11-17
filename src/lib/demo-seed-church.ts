import { createAdminSupabase } from '@/lib/supabase/admin'
import { DEMO_FLAVOR, DEMO_MODE, demoProblems } from '@/lib/demo'
import { DEMO_DOMAIN, DEMO_LOGINS, makeLogin, must, wipe, type ResetResult } from '@/lib/demo-seed'

// The church reskin's starting state (Creative Eye proposal for Second Baptist
// Church of Elgin, Nov 16). Cosmetic only: the same tables the wrestling club
// uses, filled with invented church members, ministries, group leaders and
// sample gifts. No real person, member or gift. Birthdays fall on January 1 of
// a fixed year; every email ends in .example, which never delivers.
//
// How the club's tables carry church data:
//   profiles (parents)        -> members' accounts
//   athletes (wrestlers)      -> people in a ministry ("participants")
//   practice_group            -> the ministry: Music Ministry, ELEVATE Youth,
//                                Grief & Recovery, Hospitality
//   coaches                   -> group leaders and church staff
//   practices                 -> weekly ministry meetings
//   dues_payments             -> giving records (sample gifts)
//   tournaments               -> retreats and trips
//   sponsors                  -> community partners

const day = (offset: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

const GIVING = '2026 Giving'

// Website text the content editor opens on, in place of the club's defaults.
const PAGE_CONTENT: Record<string, string> = {
  'home.hero.line1': 'Worship.',
  'home.hero.line2': 'Serve.',
  'home.hero.line3': 'Belong.',
  'home.intro.body1':
    'Second Baptist Church of Elgin is a family of believers who gather to worship, grow in faith and serve our neighbors. Whatever your story, there is a place for you here.',
  'home.intro.body2':
    'From the Music Ministry to ELEVATE Youth, Grief & Recovery and Hospitality, every ministry is a way to belong, to serve and to be known.',
  'home.intro.stat_years': '100+',
  'home.intro.stat_wrestlers': '4 ministries',
  'home.hero.photo': '/images/demo/hero-mobile.jpg',
  'home.tony.photo': '/images/demo/welcome.jpg',
  'facility.photo': '/images/demo/campus.jpg',
  'about.hero_photo': '/images/demo/about.jpg',
  'home.tony.quote':
    'Welcome home. Whether this is your first Sunday or your five-hundredth, we are glad you are here. Come as you are.',
  'facility.address_line1': 'Church office',
  'facility.address_line2': 'Elgin, Illinois',
  'home.facility.body': 'Worship, classes and fellowship all happen under one roof, with parking on site and an accessible entrance.',
  'about.intro': 'We are a church rooted in worship, the Word and service to our community.',
  'about.story1': 'Sample text for the demo: the church history and story would go here, edited by staff from this screen.',
  'about.story2': 'Sample text for the demo: a second paragraph of the church story.',
  'about.value1': 'Worship that honors God',
  'about.value2': 'Teaching rooted in Scripture',
  'about.value3': 'Care for one another',
  'about.value4': 'Service to our neighbors',
}

export async function resetChurchDemo(password: string): Promise<ResetResult> {
  if (!DEMO_MODE || DEMO_FLAVOR !== 'church') return { ok: false, error: 'This is not the church demo.' }
  const problems = demoProblems(process.env)
  if (problems.length) return { ok: false, error: problems.join(' ') }
  if (password.length < 12) return { ok: false, error: 'The demo password must be at least 12 characters.' }
  const admin = createAdminSupabase()

  try {
    await wipe(admin)

    // Church staff: a full admin and a limited admin.
    const adminId = await makeLogin(admin, password, { email: DEMO_LOGINS.admin, first: 'Jordan', last: 'Ellis', role: 'admin', scope: 'full' })
    await makeLogin(admin, password, { email: DEMO_LOGINS.staff, first: 'Taylor', last: 'Morgan', role: 'admin', scope: 'limited' })

    // Members (account holders). parent@ is the demo member login.
    const hill = await makeLogin(admin, password, { email: DEMO_LOGINS.parent, first: 'Renee', last: 'Hill', phone: '5550100201' })
    const brooks = await makeLogin(admin, password, { email: `brooks@${DEMO_DOMAIN}`, first: 'Angela', last: 'Brooks', phone: '5550100202' })
    const freeman = await makeLogin(admin, password, { email: `freeman@${DEMO_DOMAIN}`, first: 'Calvin', last: 'Freeman', phone: '5550100203' })
    const marcus = await makeLogin(admin, password, { email: `marcus.hill@${DEMO_DOMAIN}`, first: 'Marcus', last: 'Hill', phone: '5550100204' })

    const person = (member: string, first: string, last: string, year: number, ministry: string) => ({
      parent_id: member,
      first_name: first,
      last_name: last,
      date_of_birth: `${year}-01-01`,
      practice_group: ministry,
      active: true,
    })
    const people = await must(
      'ministry participants',
      admin
        .from('athletes')
        .insert([
          person(hill, 'Renee', 'Hill', 1982, 'Music Ministry'),
          person(hill, 'Jalen', 'Hill', 2011, 'ELEVATE Youth'),
          person(hill, 'Maya', 'Hill', 2013, 'ELEVATE Youth'),
          person(brooks, 'Angela', 'Brooks', 1969, 'Grief & Recovery'),
          person(freeman, 'Calvin', 'Freeman', 1958, 'Hospitality'),
          person(freeman, 'Gloria', 'Freeman', 1960, 'Hospitality'),
        ])
        .select('id, first_name, last_name')
    )
    const who = (first: string, last: string) => people.find((p) => p.first_name === first && p.last_name === last)!.id

    // Marcus shares access to the Hill household.
    await must(
      'household link',
      admin.from('family_guardians').insert({ owner_id: hill, guardian_id: marcus, athlete_ids: [who('Renee', 'Hill'), who('Jalen', 'Hill'), who('Maya', 'Hill')], locked: true })
    )

    // Giving: sample gifts. One pledge still open.
    const gift = (member: string, first: string, last: string, cents: number, status: 'paid' | 'pending', offset: number) => ({
      parent_id: member,
      athlete_id: who(first, last),
      season: GIVING,
      amount_cents: cents,
      amount_paid_cents: status === 'paid' ? cents : 0,
      status,
      due_date: day(offset),
    })
    await must(
      'giving',
      admin.from('dues_payments').insert([
        gift(hill, 'Renee', 'Hill', 25000, 'paid', -21),
        gift(hill, 'Renee', 'Hill', 25000, 'paid', -7),
        gift(brooks, 'Angela', 'Brooks', 10000, 'paid', -14),
        gift(freeman, 'Calvin', 'Freeman', 50000, 'paid', -10),
        gift(freeman, 'Gloria', 'Freeman', 15000, 'pending', 20),
      ])
    )

    // Weekly ministry meetings.
    await must(
      'meetings',
      admin.from('practices').insert([
        { practice_group: 'Music Ministry', weekday: 4, start_time: '19:00', end_time: '20:30', location: 'Sanctuary', active: true },
        { practice_group: 'ELEVATE Youth', weekday: 3, start_time: '18:30', end_time: '20:00', location: 'Youth Room', active: true },
        { practice_group: 'Grief & Recovery', weekday: 2, start_time: '18:00', end_time: '19:30', location: 'Room 104', active: true },
        { practice_group: 'Hospitality', weekday: 6, start_time: '10:00', end_time: '11:30', location: 'Fellowship Hall', active: true },
      ])
    )
    await must(
      'events',
      admin.from('club_events').insert([
        { title: 'Volunteer Appreciation Dinner', event_type: 'banquet', date: day(12), start_time: '18:00', end_time: '20:00', location: 'Fellowship Hall', active: true },
        { title: 'Ministry Leaders Meeting', event_type: 'meeting', date: day(5), start_time: '19:00', end_time: '20:00', location: 'Room 104', active: true },
      ])
    )

    // Retreats and trips.
    await must(
      'retreats',
      admin.from('tournaments').insert([
        {
          name: 'ELEVATE Youth Winter Retreat',
          date: day(24),
          location: 'Camp Lodge',
          city: 'Elgin',
          state: 'IL',
          status: 'open',
          external_platform: 'other',
          external_registration_url: `https://register.${DEMO_DOMAIN}/winter-retreat`,
          competition_level: 'All ages',
        },
        { name: "Women's Day Conference", date: day(45), location: 'Sanctuary', city: 'Elgin', state: 'IL', status: 'not_open', external_platform: 'internal' },
      ])
    )

    // Group leaders and church staff.
    await must(
      'group leaders',
      admin.from('coaches').insert([
        { name: 'Andre Lewis', role: 'Group Leader', section: 'practice', practice_group: 'Music Ministry', sort_order: 1, active: true },
        { name: 'Keisha Grant', role: 'Group Leader', section: 'practice', practice_group: 'ELEVATE Youth', sort_order: 2, active: true },
        { name: 'Paula Reyes', role: 'Group Leader', section: 'practice', practice_group: 'Grief & Recovery', sort_order: 3, active: true },
        { name: 'Harold Jenkins', role: 'Group Leader', section: 'practice', practice_group: 'Hospitality', sort_order: 4, active: true },
        { name: 'Jordan Ellis', role: 'Church Administrator', section: 'board', sort_order: 1, active: true },
        { name: 'Taylor Morgan', role: 'Ministry Coordinator', section: 'board', sort_order: 2, active: true },
      ])
    )
    await must(
      'faqs',
      admin.from('faq_items').insert([
        { question: 'What time are services?', answer: 'Sample answer for the demo: service times would be listed here.', sort_order: 1, active: true },
        { question: 'How do I join a ministry?', answer: 'Sign in, open your household and pick a ministry. A group leader will follow up.', sort_order: 2, active: true },
        { question: 'How do I give online?', answer: 'Sign in and open Giving. Every gift has a record you can look back on.', sort_order: 3, active: true },
      ])
    )
    await must(
      'community partners',
      admin.from('sponsors').insert([
        { name: 'Riverside Grocery Co-op', tier: 'platinum', industry: 'Grocery', description: 'Sample community partner.', active: true },
        { name: 'Northside Print Shop', tier: 'yellow', industry: 'Printing', description: 'Sample community partner.', active: true },
        { name: 'Cornerstone Catering', tier: 'black', industry: 'Catering', description: 'Sample community partner.', active: true },
      ])
    )

    // Two past messages for Communications history.
    const now = Date.now()
    await must(
      'messages',
      admin.from('communication_log').insert([
        {
          channel: 'email',
          comm_type: 'general_blast',
          status: 'sent',
          subject: 'Music Ministry: rehearsal moves to 7:30 this Thursday',
          body_preview: 'Sample message for the demo.',
          recipient_email: `freeman@${DEMO_DOMAIN}`,
          recipient_id: freeman,
          sent_at: new Date(now - 3 * 86400000).toISOString(),
        },
        {
          channel: 'email',
          comm_type: 'general_blast',
          status: 'sent',
          subject: 'All church: Volunteer Appreciation Dinner',
          body_preview: 'Sample message for the demo.',
          recipient_email: DEMO_LOGINS.parent,
          recipient_id: hill,
          sent_at: new Date(now - 86400000).toISOString(),
        },
      ])
    )

    // Website text, so the content editor shows church copy.
    await must(
      'website text',
      admin.from('page_content').insert(Object.entries(PAGE_CONTENT).map(([key, value]) => ({ key, value })))
    )

    void adminId
    return {
      ok: true,
      summary: `Church demo reset: 3 member households, ${people.length} ministry participants, 2 staff logins, 4 ministries, 5 sample gifts, 2 retreats.`,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Reset failed.' }
  }
}
