'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabase } from '@/lib/supabase/server'
import { contentField, isContentKey } from '@/lib/content/registry'

// Writes go through the authenticated server client; `admin_write_page_content`
// RLS enforces admin-only, and /admin is middleware-gated (defense in depth).

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateContent(values: Record<string, string>): Promise<ActionResult> {
  // Only registered keys are writable — never trust arbitrary keys from the client.
  const entries = Object.entries(values).filter(([key]) => isContentKey(key))
  if (entries.length === 0) return { ok: false, error: 'Nothing to save.' }

  const now = new Date().toISOString()
  const rows = entries.map(([key, value]) => ({ key, value: (value ?? '').trim(), updated_at: now }))

  const supabase = await createServerSupabase()
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
