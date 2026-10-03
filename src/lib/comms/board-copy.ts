import { createAdminSupabase } from '@/lib/supabase/admin'
import { sendCommEmail } from '@/lib/comms/send-email'
import type { CommTarget } from '@/lib/comms/recipients'
import type { BoardCopyRecipient, CommType } from '@/types/database'

/**
 * Board copy. Every send through the site (a message an admin writes, or one
 * of the automatic reminders) also goes, once, to each person on the board
 * list, so the people who run the club see what families were told even when
 * they are not wrestling parents themselves. One copy per send per board
 * member: not one per family.
 */

export const BOARD_COPY_PREFIX = '[Board copy] '

// Spaced well under the email provider's per-second ceiling.
const SEND_SPACING_MS = 150

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Plain words for who a send went to, shown at the top of the board's copy. */
export function describeAudience(target: CommTarget, tournamentName?: string | null): string {
  switch (target.type) {
    case 'all':
      return 'All active parents'
    case 'practice_groups':
      return `Practice groups: ${target.practiceGroups.join(', ')}`
    case 'tournament_registrants':
      return tournamentName ? `Registrants for ${tournamentName}` : 'A tournament’s registrants'
    case 'outstanding_dues':
      return 'Parents with outstanding dues'
    case 'missing_document':
      return `Parents missing: ${target.documents
        .map((d) => (d === 'birth_certificate' ? 'birth certificate' : 'USA Wrestling card'))
        .join(' and ')}`
    case 'custom':
      return `${target.profileIds.length} specific parent${target.profileIds.length === 1 ? '' : 's'}`
  }
}

export type SendCounts = { emailsSent: number; emailsFailed: number; smsSent: number; smsFailed: number }

type BoardCopyContent = {
  audience: string
  totalRecipients: number
  channel: 'email' | 'sms' | 'both'
  subject?: string | null
  message: string
  counts: SendCounts
  sentAt: Date
}

export function boardCopySubject(subject: string | null | undefined, channel: BoardCopyContent['channel']): string {
  return `${BOARD_COPY_PREFIX}${subject?.trim() || (channel === 'sms' ? 'Text message to families' : 'Message to families')}`
}

/** The board's copy: a short "who got this" header, then the message as families saw it. */
export function boardCopyHtml(c: BoardCopyContent): string {
  const lines = [`<strong>Board copy.</strong> Sent to: ${escapeHtml(c.audience)} (${c.totalRecipients} ${c.totalRecipients === 1 ? 'family' : 'families'}).`]
  if (c.channel !== 'sms') lines.push(`Emails: ${c.counts.emailsSent} sent, ${c.counts.emailsFailed} failed.`)
  if (c.channel !== 'email') lines.push(`Texts: ${c.counts.smsSent} sent, ${c.counts.smsFailed} failed.`)
  lines.push(
    c.sentAt.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }) + ' Central.'
  )
  // A text-only message is plain text; an email message is already HTML.
  const body = c.channel === 'sms' ? escapeHtml(c.message).replace(/\n/g, '<br>') : c.message
  return (
    `<div style="border:1px solid #d9d9d9;background:#f6f6f6;padding:12px 14px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333">` +
    lines.join('<br>') +
    `</div><br>${body}`
  )
}

export async function listBoardRecipients(): Promise<BoardCopyRecipient[]> {
  const { data, error } = await createAdminSupabase()
    .from('board_copy_recipients')
    .select('id, name, email, created_at')
    .order('name', { ascending: true })
  if (error) throw new Error(`Could not read the board copy list: ${error.message}`)
  return (data ?? []) as BoardCopyRecipient[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sends one copy to each board member, logging each in the message history.
 * A board member who already received this send as a family (same address) is
 * skipped, so nobody gets it twice. Never throws for a delivery problem: the
 * families' send has already happened and must not be reported as failed.
 */
export async function sendBoardCopies(params: {
  target: CommTarget
  channel: BoardCopyContent['channel']
  commType: CommType
  subject?: string | null
  message: string
  totalRecipients: number
  counts: SendCounts
  /** Addresses the family email actually went to. */
  familyEmails: string[]
  blastId: string
  tournamentId?: string
}): Promise<{ sent: number; failed: number; skipped: number }> {
  const result = { sent: 0, failed: 0, skipped: 0 }
  if (params.totalRecipients === 0) return result // nobody was messaged: nothing to copy

  const board = await listBoardRecipients()
  if (board.length === 0) return result

  let tournamentName: string | null = null
  if (params.target.type === 'tournament_registrants') {
    const { data } = await createAdminSupabase()
      .from('tournaments')
      .select('name')
      .eq('id', params.target.tournamentId)
      .maybeSingle()
    tournamentName = data?.name ?? null
  }

  const html = boardCopyHtml({
    audience: describeAudience(params.target, tournamentName),
    totalRecipients: params.totalRecipients,
    channel: params.channel,
    subject: params.subject,
    message: params.message,
    counts: params.counts,
    sentAt: new Date(),
  })
  const subject = boardCopySubject(params.subject, params.channel)
  const alreadyGotIt = new Set(params.familyEmails.map((e) => e.trim().toLowerCase()))

  for (const member of board) {
    if (alreadyGotIt.has(member.email.trim().toLowerCase())) {
      result.skipped += 1
      continue
    }
    const sent = await sendCommEmail({
      profileId: null,
      to: member.email,
      subject,
      html,
      commType: params.commType,
      tournamentId: params.tournamentId,
      blastId: params.blastId,
    })
    if (sent.ok) result.sent += 1
    else result.failed += 1
    await sleep(SEND_SPACING_MS)
  }
  return result
}
