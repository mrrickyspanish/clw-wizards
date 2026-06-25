'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { resolveRecipients, type CommTarget } from '@/lib/comms/recipients'

export type PreviewResult =
  | { ok: true; count: number; sample: string[] }
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

  const recipients = await resolveRecipients(target)
  return {
    ok: true,
    count: recipients.length,
    sample: recipients
      .slice(0, 5)
      .map((r) => r.full_name || r.email || 'Unnamed parent'),
  }
}
