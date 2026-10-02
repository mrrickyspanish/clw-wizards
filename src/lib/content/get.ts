import { cache } from 'react'

import { createServerSupabase } from '@/lib/supabase/server'
import { createPublicSupabase } from '@/lib/supabase/public'
import { CONTENT_DEFAULTS, safeMenuHref } from './registry'

export type SiteContent = {
  /** Effective value for a key: the saved override, else the code default. */
  get: (key: string) => string
}

// Request-deduped (React cache): every component that needs content shares one
// query per render. Falls back to code defaults for any key without an override,
// and if the table isn't there yet / the query fails, so the site never breaks.
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  let overrides: Record<string, string> = {}
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('page_content').select('key, value')
    for (const row of data ?? []) {
      const value = row.value ?? ''
      if (value.trim() !== '') overrides[row.key] = value
    }
  } catch {
    overrides = {}
  }
  const merged = { ...CONTENT_DEFAULTS, ...overrides }
  return {
    get: (key: string) => merged[key] ?? '',
  }
})

export type ExtraNavLink = { label: string; href: string; external: boolean }

const MENU_KEYS = ['nav.extra.active', 'nav.extra.label', 'nav.extra.url']

/**
 * The club's temporary menu link, when it is switched on and complete.
 *
 * Read with the cookie-free public client, not getSiteContent(): this runs in
 * the shared marketing layout, and reading cookies there would stop every
 * public page from being cached. Saving the link in Admin -> Content
 * revalidates the whole layout, so it still appears straight away.
 */
export async function getExtraNavLink(): Promise<ExtraNavLink | null> {
  const supabase = createPublicSupabase()
  if (!supabase) return null
  try {
    const { data } = await supabase.from('page_content').select('key, value').in('key', MENU_KEYS)
    const value = (key: string) => (data ?? []).find((row) => row.key === key)?.value?.trim() ?? CONTENT_DEFAULTS[key] ?? ''
    if (value('nav.extra.active') !== 'on') return null
    const label = value('nav.extra.label')
    const href = safeMenuHref(value('nav.extra.url'))
    if (!label || !href) return null
    return { label, href, external: !href.startsWith('/') }
  } catch {
    return null
  }
}
