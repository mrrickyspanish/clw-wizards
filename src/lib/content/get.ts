import { cache } from 'react'

import { createServerSupabase } from '@/lib/supabase/server'
import { CONTENT_DEFAULTS } from './registry'

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
