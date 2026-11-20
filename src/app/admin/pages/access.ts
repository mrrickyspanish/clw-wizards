import { notFound } from 'next/navigation'

import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { currentChurchRole } from '@/lib/demo-roles-server'
import { SAMPLE_PAGES, type SamplePage } from '@/lib/demo-pages'

export type PagesMode = 'full' | 'editor' | 'ministry'

/** The signed-in demo role's page access, or 404 outside the church demo. */
export async function pagesAccess(): Promise<{ mode: PagesMode; ministry?: string; name: string }> {
  if (!CHURCH_READ_ONLY) notFound()
  const role = await currentChurchRole()
  if (!role?.pages) notFound()
  return { mode: role.pages, ministry: role.group, name: `${role.first} ${role.last}` }
}

/** The sample pages this role may see. */
export function visiblePages(mode: PagesMode, ministry?: string): SamplePage[] {
  return mode === 'ministry' ? SAMPLE_PAGES.filter((p) => p.ministry === ministry) : SAMPLE_PAGES
}
