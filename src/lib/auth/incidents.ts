import { Resend } from 'resend'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { ORG } from '@/config/org.config'
import { safeAuthError, safeEmail, validAttempt, isSelfHealingFailure, type FailureStep } from './incident-policy'
import { firstAlert, gotInSince, resolvedAlert, type AlertPerson } from './alert-copy'

// Wait this long before emailing about a failure (Ricky, Nov 2): most parents
// sort it out themselves within minutes, and then the email just says so.
export const ALERT_DELAY_MINUTES = 10
// How long to keep watching a stuck parent for the "they got in" follow-up.
const FOLLOW_UP_DAYS = 7

type Admin = ReturnType<typeof createAdminSupabase>

/** Who the email belongs to and when they last logged in. Never blocks an alert. */
async function lookupPerson(admin: Admin, email: string | null): Promise<AlertPerson> {
  if (!email) return null
  try {
    const { data: profile } = await admin.from('profiles').select('id, full_name').eq('email', email).maybeSingle()
    if (!profile) return null
    const { data } = await admin.auth.admin.getUserById(profile.id)
    return { name: profile.full_name ?? null, signedInAt: data?.user?.last_sign_in_at ?? null }
  } catch {
    return null
  }
}

export async function incidentFingerprint(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export async function linkAttemptId(value: string) {
  const hash = await incidentFingerprint(value)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

export async function requestSourceKey(request: { headers: Headers }) {
  return incidentFingerprint(`request:${request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'}`)
}

// Remember who a reset was sent to without retaining the token. An alert can
// identify the parent even when verification fails before a session exists.
export async function registerResetAttempt(id: string, email: string) {
  try {
    const { error } = await createAdminSupabase().from('parent_auth_incidents').insert({
      id, email: safeEmail(email), email_source: 'reset recipient',
    })
    if (error) throw error
  } catch {
    // Observability must never prevent a working reset email from being sent.
    console.error('[parent-auth] attempt registration failed', { referenceId: id })
  }
}

export async function deliverParentAuthIncident(id: string) {
  const admin = createAdminSupabase()
  const { data, error } = await admin.rpc('claim_parent_auth_incident', { p_id: id })
  if (error) throw error
  const claimed = data?.[0]
  if (!claimed) return
  // A claimed row always has its failure; the guard is for the type.
  const firstSeen = claimed.first_seen ?? claimed.created_at
  const incident = { ...claimed, first_seen: firstSeen }
  try {
    const key = readCredential('RESEND_API_KEY')
    const from = readCredential('RESEND_FROM_EMAIL')
    const to = readCredential('ALERT_EMAIL') ?? ORG.contactEmail
    if (!key || !from) throw new Error('Alert email configuration missing')
    // Plain English: who, what they tried, why it was turned down, and whether
    // they've gotten in since. First-event fields stay immutable, so a retry of
    // the same outcome sends an identical payload under the same key.
    const person = await lookupPerson(admin, incident.first_email)
    const copy = firstAlert(incident, person, ORG.shortName)
    // A retry must send the same words under the same key, so the key changes
    // whenever the words can: open vs got in, and the sign-in time it quotes.
    const outcome = copy.resolved ? `resolved/${person?.signedInAt}` : 'open'
    const sendOptions = { idempotencyKey: `parent-auth/${id}/${outcome}`, signal: AbortSignal.timeout(8000) }
    const result = await new Resend(key).emails.send({ from, to: [to], subject: copy.subject, text: copy.text }, sendOptions)
    if (result.error || !result.data?.id) throw new Error('Alert provider did not accept the message')
    const now = new Date().toISOString()
    const saved = await admin.from('parent_auth_incidents').update({
      notified_at: now, message_id: result.data.id, lease_until: null, ...(copy.resolved ? { resolved_at: now } : {}),
    }).eq('id', id)
    if (saved.error) throw saved.error
    console.info('[parent-auth] alert accepted', { referenceId: id, messageId: result.data.id })
  } catch {
    await admin.from('parent_auth_incidents').update({ lease_until: null }).eq('id', id)
    console.error('[parent-auth] alert delivery pending', { referenceId: id })
    throw new Error('Parent auth alert delivery pending')
  }
}

/**
 * Records the incident as handled without emailing anyone. The row stays in
 * parent_auth_incidents with its diagnostics intact; only the page is dropped.
 */
async function suppressParentAuthAlert(id: string) {
  const admin = createAdminSupabase()
  const { error } = await admin.from('parent_auth_incidents').update({
    notified_at: new Date().toISOString(), message_id: 'suppressed:self-healing', lease_until: null,
  }).eq('id', id)
  if (error) throw error
  console.info('[parent-auth] self-healing failure recorded, not alerted', { referenceId: id })
}

export async function reportParentAuthFailure(input: {
  attemptId?: string | null; step: FailureStep; error: unknown; email?: string | null;
  emailSource?: string; sourceKey?: string;
}) {
  const id = validAttempt(input.attemptId) ? input.attemptId : crypto.randomUUID()
  try {
    const { data, error } = await createAdminSupabase().rpc('record_parent_auth_failure', {
      p_id: id, p_step: input.step, p_error: safeAuthError(input.error),
      p_email: safeEmail(input.email), p_email_source: input.emailSource ?? 'unavailable',
      p_source_key: input.sourceKey ?? 'server',
    })
    if (error) throw error
    if (data) {
      // Marked notified rather than left pending, so the retry sweep does not
      // pick it back up and mail it an hour later.
      if (isSelfHealingFailure(input.step, input.error)) await suppressParentAuthAlert(id)
      // Anything else waits ALERT_DELAY_MINUTES for the 5-minute sweep
      // (sendDueParentAuthAlerts), which first checks whether they got in.
    }
    return { referenceId: id, recorded: Boolean(data) }
  } catch {
    console.error('[parent-auth] reporting incomplete', { referenceId: id, step: input.step })
    return { referenceId: id, recorded: false }
  }
}

/**
 * The 5-minute sweep: sends each alert once its timer is up (or retries one
 * that didn't go out), then closes the loop on anyone who was stuck and has
 * since logged in.
 */
export async function sendDueParentAuthAlerts(now = Date.now()) {
  const admin = createAdminSupabase()
  const { data, error } = await admin.from('parent_auth_incidents')
    .select('id').is('notified_at', null).not('first_seen', 'is', null)
    .gte('first_seen', new Date(now - 23 * 60 * 60 * 1000).toISOString())
    .lte('first_seen', new Date(now - ALERT_DELAY_MINUTES * 60 * 1000).toISOString())
    .order('first_seen').limit(20)
  if (error) throw error
  const results = await Promise.allSettled((data ?? []).map(row => deliverParentAuthIncident(row.id)))
  const followUps = await sendResolvedFollowUps(admin, now)
  if (results.some(result => result.status === 'rejected') || !followUps) throw new Error('Some alerts remain pending')
}

/** "They got in" for each alert that went out while the parent was still stuck. */
async function sendResolvedFollowUps(admin: Admin, now: number): Promise<boolean> {
  const { data, error } = await admin.from('parent_auth_incidents')
    .select('id, first_email, first_step, first_error, first_seen')
    .not('notified_at', 'is', null).is('resolved_at', null).not('first_email', 'is', null)
    .not('message_id', 'like', 'suppressed%')
    .gte('first_seen', new Date(now - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString())
    .order('first_seen').limit(50)
  if (error) return false
  let ok = true
  for (const row of data ?? []) {
    if (!row.first_seen) continue
    const incident = { ...row, first_seen: row.first_seen }
    const person = await lookupPerson(admin, incident.first_email)
    if (!person || !gotInSince(incident, person)) continue
    // Claim it first, so two overlapping sweeps can't both send it.
    const { data: claimed } = await admin.from('parent_auth_incidents')
      .update({ resolved_at: new Date().toISOString() }).eq('id', incident.id).is('resolved_at', null).select('id')
    if (!claimed?.length) continue
    try {
      const key = readCredential('RESEND_API_KEY')
      const from = readCredential('RESEND_FROM_EMAIL')
      const to = readCredential('ALERT_EMAIL') ?? ORG.contactEmail
      if (!key || !from) throw new Error('Alert email configuration missing')
      const copy = resolvedAlert(incident, person, ORG.shortName)
      const sendOptions = { idempotencyKey: `parent-auth-resolved/${incident.id}/${person.signedInAt}`, signal: AbortSignal.timeout(8000) }
      const result = await new Resend(key).emails.send({ from, to: [to], subject: copy.subject, text: copy.text }, sendOptions)
      if (result.error || !result.data?.id) throw new Error('Alert provider did not accept the message')
      await admin.from('parent_auth_incidents').update({ resolved_message_id: result.data.id }).eq('id', incident.id)
      console.info('[parent-auth] resolved follow-up accepted', { referenceId: incident.id })
    } catch {
      // Put it back so the next sweep tries again.
      await admin.from('parent_auth_incidents').update({ resolved_at: null }).eq('id', incident.id)
      console.error('[parent-auth] resolved follow-up pending', { referenceId: incident.id })
      ok = false
    }
  }
  return ok
}
