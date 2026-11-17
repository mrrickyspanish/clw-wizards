import { DEMO_FLAVOR, DEMO_MODE } from '@/lib/demo'

// The church staff dashboard demo is read-only (RJ, Nov 17): anyone with the
// share link can sign in as church staff with one click, so nothing they do
// may change the demo. This is the app's half of that. Every Supabase client
// the app makes on a church deployment goes through readOnlyFetch, which lets
// reads through and answers every change with an error, so each save, send,
// upload, delete, invite and edit fails the way a refused request does and the
// page shows the message below. The database refuses changes from the demo
// accounts too (scripts/demo-church-readonly.sql), for anyone who goes around
// the app.

export const CHURCH_READ_ONLY = DEMO_MODE && DEMO_FLAVOR === 'church'
export const READ_ONLY_MESSAGE = 'Read-only demo: changes are not saved.'

// Requests that look like writes but only read or keep a session going.
const ALLOWED_POSTS = [
  /^\/storage\/v1\/object\/list\//, // list files
  /^\/storage\/v1\/object\/sign\//, // signed download links
  /^\/auth\/v1\/token$/, // session refresh
  /^\/auth\/v1\/logout$/,
  /^\/auth\/v1\/verify$/, // the entry buttons' one-time sign-in
  /^\/rest\/v1\/rpc\/(manages_athlete|family_link_names)$/, // read-only lookups
]

function methodOf(input: RequestInfo | URL, init?: RequestInit) {
  return (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase()
}

function pathOf(input: RequestInfo | URL) {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  try {
    return new URL(href).pathname
  } catch {
    return href
  }
}

/** True when this request would change something in a read-only demo. */
export function isDemoWrite(input: RequestInfo | URL, init?: RequestInit) {
  const method = methodOf(input, init)
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false
  const path = pathOf(input)
  return !ALLOWED_POSTS.some((rx) => rx.test(path))
}

/** fetch for Supabase clients: reads pass, writes come back refused. */
export function readOnlyFetch(base: typeof fetch = fetch): typeof fetch {
  return (input, init) => {
    if (!isDemoWrite(input, init)) return base(input, init)
    const body = JSON.stringify({ message: READ_ONLY_MESSAGE, error: READ_ONLY_MESSAGE, msg: READ_ONLY_MESSAGE, code: 'demo_read_only' })
    return Promise.resolve(new Response(body, { status: 403, headers: { 'content-type': 'application/json' } }))
  }
}

/** Client options that make a Supabase client read-only on church deployments. */
export function readOnlyGlobal(fetcher?: typeof fetch): { global?: { fetch: typeof fetch } } {
  if (CHURCH_READ_ONLY) return { global: { fetch: readOnlyFetch(fetcher ?? fetch) } }
  return fetcher ? { global: { fetch: fetcher } } : {}
}
