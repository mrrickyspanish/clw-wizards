'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveRecipients, type CommTarget } from '@/lib/comms/recipients'

export type PreviewRecipient = { name: string; email: string | null }

export type PreviewResult =
  | { ok: true; count: number; recipients: PreviewRecipient[] }
  | { ok: false; error: string }

// Lets an admin see how many parents a target resolves to before they hit send.
// Recipient resolution uses the service-role client (it spans other families'
// rows), so this is gated to admin/staff first — same access bar as the blast
// endpoint itself.
export async function previewRecipients(target: CommTarget): Promise<PreviewResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    return { ok: false, error: 'Admin access required' }
  }

  // The whole list, alphabetical, so an admin can scroll it and check exactly
  // who a send reaches before it goes out.
  const recipients = (await resolveRecipients(target))
    .map((r) => ({ name: r.full_name || r.email || 'Unnamed parent', email: r.email }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { ok: true, count: recipients.length, recipients }
}
