import 'server-only'

import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import { formatCents } from '@/lib/format/money'
import { WRESTLER_SOURCE_LABELS, wrestlerSource } from '@/lib/registration-source'
import type { Athlete, DuesPayment, Profile, SeasonEnrollment, SeasonRegistration } from '@/types/database'

// The RPC keeps created_at and moves submitted_at when a family resubmits
// (after changes requested, or after withdrawing), so a gap between the two
// means this is not the first submission.
const RESUBMIT_GAP_MS = 60_000

/**
 * Tells the club contact each time a family submits a season registration,
 * so new sign-ups do not sit unnoticed until someone reads the whole list.
 * One short email per wrestler, with the running count for the season.
 */
export async function sendRegistrationNotice(params: { seasonRegistrationId: string; athleteId: string; userId: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const supabase = createAdminSupabase()

  const [{ data: seasonRow }, { data: athleteRow }, { data: profileRow }, { data: enrollmentRow }, { count }] =
    await Promise.all([
      supabase.from('season_registrations').select('*').eq('id', params.seasonRegistrationId).maybeSingle(),
      supabase.from('athletes').select('*').eq('id', params.athleteId).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', params.userId).maybeSingle(),
      supabase
        .from('season_enrollments')
        .select('*')
        .eq('season_registration_id', params.seasonRegistrationId)
        .eq('athlete_id', params.athleteId)
        .maybeSingle(),
      supabase
        .from('season_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('season_registration_id', params.seasonRegistrationId)
        .neq('status', 'withdrawn'),
    ])

  const season = seasonRow as SeasonRegistration | null
  const athlete = athleteRow as Athlete | null
  const profile = profileRow as Profile | null
  const enrollment = enrollmentRow as SeasonEnrollment | null
  if (!season || !athlete || !enrollment) return

  const { data: duesRow } = enrollment.dues_payment_id
    ? await supabase.from('dues_payments').select('*').eq('id', enrollment.dues_payment_id).maybeSingle()
    : { data: null }
  const dues = duesRow as DuesPayment | null

  const athleteName = `${athlete.first_name} ${athlete.last_name}`
  const resubmitted = Date.parse(enrollment.submitted_at) - Date.parse(enrollment.created_at) > RESUBMIT_GAP_MS
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' })

  const body = [
    `${profile?.full_name ?? 'A family'} ${resubmitted ? 'resubmitted' : 'just submitted'} a registration for ${athleteName} (${season.season_label}).`,
    '',
    `Wrestler: ${athleteName}, born ${athlete.date_of_birth}`,
    `Parent: ${[profile?.full_name, profile?.email, profile?.phone].filter(Boolean).join(' · ') || 'unknown'}`,
    `Came in through: ${WRESTLER_SOURCE_LABELS[wrestlerSource(athlete.created_at)]}, added ${day(athlete.created_at)}`,
    dues ? `Dues: ${formatCents(dues.amount_paid_cents)} paid of ${formatCents(dues.amount_cents)}` : null,
    count != null ? `Registrations this season: ${count}` : null,
    '',
    `Review it: ${siteUrl}/admin/registrations`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
    to: ORG.contactEmail,
    subject: `${resubmitted ? 'Registration resubmitted' : 'New registration'}: ${athleteName}`,
    text: body,
  })

  if (error) {
    console.error('Registration notice email failed:', error.message)
  }
}
