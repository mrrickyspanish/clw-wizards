'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import { contentField, contentLimit, isContentKey } from '@/lib/content/registry'

// Writes go through the authenticated server client; `full_admin_write_page_content`
// RLS enforces full-admin-only, and /admin/content is middleware-gated to full
// admins (defense in depth).

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateContent(values: Record<string, string>): Promise<ActionResult> {
  // Only registered keys are writable — never trust arbitrary keys from the client.
  const entries = Object.entries(values).filter(([key]) => isContentKey(key))
  if (entries.length === 0) return { ok: false, error: 'Nothing to save.' }

  const now = new Date().toISOString()
  const rows = entries.map(([key, value]) => ({ key, value: (value ?? '').trim(), updated_at: now }))

  // Enforce the per-field character caps server-side too — the editor stops
  // typing at the max, but never trust the client.
  for (const row of rows) {
    const limit = contentLimit(row.key)
    if (!limit) continue
    const label = contentField(row.key)?.label ?? row.key
    if (row.value.length > limit.max) {
      return { ok: false, error: `"${label}" must be ${limit.max} characters or fewer.` }
    }
    if (row.value.length < limit.min) {
      return { ok: false, error: `"${label}" must be at least ${limit.min} characters.` }
    }
  }

  const supabase = await createServerSupabase()
  if (!(await isFullAdmin(supabase))) return { ok: false, error: 'Only full admins can edit website content.' }
  const { error } = await supabase.from('page_content').upsert(rows, { onConflict: 'key' })
  if (error) return { ok: false, error: error.message }

  // Revalidate every public path touched, plus the editor itself.
  const paths = new Set<string>(['/admin/content'])
  for (const [key] of entries) {
    const field = contentField(key)
    if (field) for (const path of field.revalidate) paths.add(path)
  }
  for (const path of paths) revalidatePath(path)

  return { ok: true }
}
