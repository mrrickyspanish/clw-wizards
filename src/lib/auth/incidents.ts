import { Resend } from 'resend'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { readCredential } from '@/lib/env'
import { ORG } from '@/config/org.config'
import { safeAuthError, safeEmail, validAttempt, type FailureStep } from './incident-policy'

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
  const incident = data?.[0]
  if (!incident) return
  try {
    const key = readCredential('RESEND_API_KEY')
    const from = readCredential('RESEND_FROM_EMAIL')
    const to = readCredential('ALERT_EMAIL') ?? ORG.contactEmail
    if (!key || !from) throw new Error('Alert email configuration missing')
    // First-event fields stay immutable so retries use an identical payload.
    const sendOptions = { idempotencyKey: `parent-auth/${id}`, signal: AbortSignal.timeout(8000) }
    const result = await new Resend(key).emails.send({
      from, to: [to], subject: `[${ORG.shortName} Alert] Parent blocked: ${incident.first_step}`,
      text: [
        'A parent authentication step failed.',
        `Email: ${incident.first_email ?? 'Unavailable (no verified session)'}`,
        `Email source: ${incident.first_email_source ?? 'unavailable'}`,
        `Failed step: ${incident.first_step}`,
        `Actual error: ${JSON.stringify(incident.first_error)}`,
        `Timestamp (UTC): ${incident.first_seen}`,
        `Reference ID: ${incident.id}`,
        '',
        'Retries from this attempt are grouped under this reference in parent_auth_incidents.',
        'This reports a failure at that time; it does not mean a later retry also failed.',
      ].join('\n'),
    }, sendOptions)
    if (result.error || !result.data?.id) throw new Error('Alert provider did not accept the message')
    const saved = await admin.from('parent_auth_incidents').update({
      notified_at: new Date().toISOString(), message_id: result.data.id, lease_until: null,
    }).eq('id', id)
    if (saved.error) throw saved.error
    console.info('[parent-auth] alert accepted', { referenceId: id, messageId: result.data.id })
  } catch {
    await admin.from('parent_auth_incidents').update({ lease_until: null }).eq('id', id)
    console.error('[parent-auth] alert delivery pending', { referenceId: id })
    throw new Error('Parent auth alert delivery pending')
  }
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
    if (data) await deliverParentAuthIncident(id)
    return { referenceId: id, recorded: Boolean(data) }
  } catch {
    console.error('[parent-auth] reporting incomplete', { referenceId: id, step: input.step })
    return { referenceId: id, recorded: false }
  }
}

export async function retryParentAuthAlerts() {
  const { data, error } = await createAdminSupabase().from('parent_auth_incidents')
    .select('id').is('notified_at', null).not('first_seen', 'is', null)
    .gte('first_seen', new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())
    .order('first_seen').limit(20)
  if (error) throw error
  const results = await Promise.allSettled((data ?? []).map(row => deliverParentAuthIncident(row.id)))
  if (results.some(result => result.status === 'rejected')) throw new Error('Some alerts remain pending')
}
