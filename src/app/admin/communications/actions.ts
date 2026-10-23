'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { familyContactRecipients, recipientWrestlerRows, resolveRecipients, type CommTarget } from '@/lib/comms/recipients'
import { toE164 } from '@/lib/phone'

// One family on a send: the wrestlers it is about, the parent the email goes
// to, and anyone else on the family's contacts who gets a copy (a second parent).
export type PreviewRecipient = { wrestlers: string[]; parent: string; email: string | null; alsoTo: string[] }

export type PreviewResult =
  // smsCount: families who would get a text -- opted in, with a dialable mobile number.
  // contactCount: extra emails to second parents and other family contacts.
  | { ok: true; count: number; wrestlerCount: number; smsCount: number; contactCount: number; recipients: PreviewRecipient[] }
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

  // The whole list, listed by wrestler (coaches know the kids, not always the
  // parents) and alphabetical by the wrestler's last name, so an admin can
  // check exactly who a send reaches before it goes out. Families with no
  // matching wrestler sort to the end by parent name.
  const profiles = await resolveRecipients(target)
  const [wrestlersByParent, contacts] = await Promise.all([
    recipientWrestlerRows(target, profiles.map((p) => p.id)),
    familyContactRecipients(target, profiles),
  ])
  const contactsByOwner = new Map<string, string[]>()
  for (const c of contacts) {
    contactsByOwner.set(c.ownerId, [...(contactsByOwner.get(c.ownerId) ?? []), c.name ? `${c.name} · ${c.email}` : c.email])
  }
  const rows = profiles.map((p) => {
    const kids = [...(wrestlersByParent.get(p.id) ?? [])].sort(
      (a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    )
    const parent = p.full_name || p.email || 'Unnamed parent'
    return {
      recipient: {
        wrestlers: kids.map((k) => `${k.first_name} ${k.last_name}`),
        parent,
        email: p.email,
        alsoTo: contactsByOwner.get(p.id) ?? [],
      },
      sortKey: kids.length ? `0 ${kids[0].last_name} ${kids[0].first_name}` : `1 ${parent}`,
    }
  })
  rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'en', { sensitivity: 'base' }))
  const recipients = rows.map((row) => row.recipient)
  // A co-parent's row lists the same wrestlers as the other parent's, so count each wrestler once.
  const wrestlerCount = new Set([...wrestlersByParent.values()].flat().map((w) => w.id)).size
  const smsCount = profiles.filter((p) => p.sms_opt_in && toE164(p.phone)).length
  return { ok: true, count: recipients.length, wrestlerCount, smsCount, contactCount: contacts.length, recipients }
}

export type BoardActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required' }
  return { ok: true }
}

const boardSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
})

/** Add someone to the board copy list: they get one copy of every message sent to families. */
export async function addBoardRecipient(values: z.input<typeof boardSchema>): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('board_copy_recipients').insert(parsed.data)
  if (error) {
    // 23505: that address is already on the list.
    return { ok: false, error: error.code === '23505' ? 'That email is already on the board copy list.' : error.message }
  }
  revalidatePath('/admin/communications')
  return { ok: true }
}

export async function removeBoardRecipient(id: string): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Invalid person' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('board_copy_recipients').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/communications')
  return { ok: true }
}

/** Add someone to the payment notice list: they get an email each time money moves through Stripe. */
export async function addPaymentNoticeRecipient(values: z.input<typeof boardSchema>): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('payment_notice_recipients').insert(parsed.data)
  if (error) {
    return { ok: false, error: error.code === '23505' ? 'That email is already on the payment notice list.' : error.message }
  }
  revalidatePath('/admin/communications')
  return { ok: true }
}

export async function removePaymentNoticeRecipient(id: string): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Invalid person' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('payment_notice_recipients').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/communications')
  return { ok: true }
}

/** Add someone to the upload notice list: they get an email when a family uploads a card or birth certificate. */
export async function addUploadNoticeRecipient(values: z.input<typeof boardSchema>): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const parsed = boardSchema.safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('upload_notice_recipients').insert(parsed.data)
  if (error) {
    return { ok: false, error: error.code === '23505' ? 'That email is already on the upload notice list.' : error.message }
  }
  revalidatePath('/admin/communications')
  return { ok: true }
}

export async function removeUploadNoticeRecipient(id: string): Promise<BoardActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Invalid person' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('upload_notice_recipients').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/communications')
  return { ok: true }
}

const commsImageSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, 'Pictures must be under 10 MB.'),
})

export type CommsImageTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string }

const IMAGE_EXTENSIONS: Record<z.infer<typeof commsImageSchema>['contentType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * A one-time upload slot for a picture in a Communications email. The path is
 * random (never the file name, which can say who or what it is), and the
 * returned public address is what the email links to.
 */
export async function prepareCommsImageUpload(values: z.input<typeof commsImageSchema>): Promise<CommsImageTicket> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'staff') return { ok: false, error: 'Admin access required' }

  const parsed = commsImageSchema.safeParse(values)
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid picture.',
    }

  const month = new Date().toISOString().slice(0, 7)
  const path = `${month}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[parsed.data.contentType]}`
  const storage = createAdminSupabase().storage.from('comms-images')
  const { data, error } = await storage.createSignedUploadUrl(path)
  if (error || !data)
    return {
      ok: false,
      error: error?.message ?? 'Could not start the upload.',
    }
  return {
    ok: true,
    path: data.path,
    token: data.token,
    publicUrl: storage.getPublicUrl(data.path).data.publicUrl,
  }
}
