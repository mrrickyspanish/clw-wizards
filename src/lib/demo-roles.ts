import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'

// The church demo's staff roles (SBC proposal, Nov 20: Sharon asked for these
// by name). Demo-only views, not a permission system: each role is a sample
// login whose menu and reachable pages are narrowed here, on top of the
// platform's real full / limited admin split. Everything stays read-only.
// Pure data, no server imports: the middleware uses it too.

const DOMAIN = 'sbc-demo.example'

export type ChurchRole = {
  key: string
  email: string
  first: string
  last: string
  /** The platform's real access level underneath the demo role. */
  scope: 'full' | 'limited'
  label: string
  can: string
  cannot: string
  home: string
  /** Only these /admin areas (and the pages under them). */
  allow?: string[]
  /** Every area except these. */
  deny?: string[]
  /** A group role sees and messages only this ministry. */
  group?: string
  /** Communications settings tabs (board copy, notices). */
  settings: boolean
  /** Pages mock: full (create, publish, review), editor (create and edit drafts) or ministry (own ministry's pages, drafts). */
  pages?: 'full' | 'editor' | 'ministry'
  /** Menu order (UX scrub, Nov 20): these hrefs first, in this order. */
  menu?: string[]
}

export const CHURCH_ROLES: ChurchRole[] = [
  {
    key: 'admin',
    email: `admin@${DOMAIN}`,
    first: 'Jordan',
    last: 'Ellis',
    scope: 'full',
    label: 'Church Admin',
    can: 'Website pages and approving page changes, communications, members, events, retreats and the admin team.',
    cannot: 'Giving, unless also given the Giving Admin role.',
    home: '/admin/pages',
    deny: ['/admin/dues'],
    settings: false,
    pages: 'full',
    menu: ['/admin/pages', '/admin/communications', '/admin/families', '/admin/practices', '/admin/tournaments', '/admin/team'],
  },
  {
    key: 'comms',
    email: `comms@${DOMAIN}`,
    first: 'Monica',
    last: 'Price',
    scope: 'limited',
    label: 'Communications',
    can: 'Email or text the whole church, a ministry or specific members.',
    cannot: 'Website content, the admin team, giving or settings.',
    home: '/admin/communications',
    allow: ['/admin/communications'],
    settings: false,
  },
  {
    key: 'giving',
    email: `giving@${DOMAIN}`,
    first: 'Gerald',
    last: 'Watts',
    scope: 'limited',
    label: 'Giving Admin',
    can: 'Giving records and totals, editing a gift and adding a giver.',
    cannot: 'Anything outside Giving.',
    home: '/admin/dues',
    allow: ['/admin/dues'],
    settings: false,
  },
  {
    key: 'group',
    email: `music@${DOMAIN}`,
    first: 'Andre',
    last: 'Lewis',
    scope: 'limited',
    label: 'Ministry Admin: Music Ministry',
    can: 'The Music Ministry member list, messages to that ministry, and edits to its page (sent for approval).',
    cannot: 'Other ministries, giving, creating or publishing pages, or the admin team.',
    home: '/admin/pages',
    allow: ['/admin/families', '/admin/communications', '/admin/pages'],
    deny: ['/admin/pages/new', '/admin/pages/review'],
    group: 'Music Ministry',
    settings: false,
    pages: 'ministry',
    menu: ['/admin/pages', '/admin/communications', '/admin/families'],
  },
  {
    key: 'notes',
    email: `grief@${DOMAIN}`,
    first: 'Paula',
    last: 'Reyes',
    scope: 'limited',
    label: 'Note Sender: Grief & Recovery',
    can: 'Send notes to the Grief & Recovery group.',
    cannot: 'Change who is in the group, or anything else.',
    home: '/admin/communications',
    allow: ['/admin/communications'],
    group: 'Grief & Recovery',
    settings: false,
  },
  {
    key: 'staff',
    email: `staff@${DOMAIN}`,
    first: 'Taylor',
    last: 'Morgan',
    scope: 'limited',
    label: 'Ministry Staff',
    can: 'The day-to-day tools: meetings and events, communications, members and retreats.',
    cannot: 'Giving, website content or the admin team.',
    home: '/admin/practices',
    // Giving is only for the person responsible for it (SBC, Nov 20).
    deny: ['/admin/dues', '/admin/pages'],
    settings: false,
    menu: ['/admin/practices', '/admin/communications', '/admin/families', '/admin/tournaments'],
  },
  {
    key: 'editor',
    email: `pages@${DOMAIN}`,
    first: 'Lena',
    last: 'Brooks',
    scope: 'limited',
    label: 'Page Editor',
    can: 'Create and edit pages from the church templates, then send them for approval.',
    cannot: 'Publish, change the menu, members, giving or communications.',
    home: '/admin/pages',
    allow: ['/admin/pages'],
    deny: ['/admin/pages/review'],
    settings: false,
    pages: 'editor',
  },
]

export const CHURCH_MEMBER_VIEW = {
  key: 'member',
  email: `parent@${DOMAIN}`,
  label: 'Member',
  can: 'What a church member sees when they sign in.',
  home: '/dashboard',
}

/** The demo role for a signed-in email, on church deployments only. */
export function churchRoleFor(email: string | null | undefined): ChurchRole | null {
  if (!CHURCH_READ_ONLY || !email) return null
  return CHURCH_ROLES.find((r) => r.email === email.toLowerCase()) ?? null
}

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)

/**
 * Club-only screens hidden for every church staff role (UX scrub, Nov 20; RJ
 * approved): sponsor tiers, the old site editor (Pages replaces it), document
 * review, season sign-ups, the bare overview and the member view.
 */
const CHURCH_HIDDEN = ['/admin/registrations', '/admin/review', '/admin/sponsors', '/admin/content', '/dashboard']

/** Whether a demo role may open this page. */
/** Sort menu hrefs into the role's preferred order. */
export function churchMenuOrder<T extends { href: string }>(role: ChurchRole, items: T[]): T[] {
  if (!role.menu) return items
  const rank = (h: string) => { const i = role.menu!.indexOf(h); return i === -1 ? 99 : i }
  return [...items].sort((a, b) => rank(a.href) - rank(b.href))
}

export function churchAllows(role: ChurchRole, pathname: string): boolean {
  if (pathname === '/admin' || CHURCH_HIDDEN.some((p) => under(pathname, p))) return false
  if (role.deny?.some((p) => under(pathname, p))) return false
  if (role.allow) return role.allow.some((p) => under(pathname, p))
  return true
}
