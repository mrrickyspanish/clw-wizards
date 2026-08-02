import 'server-only'

import { Resend } from 'resend'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import { ageOnDecember31 } from '@/lib/registration-schema'
import type {
  Athlete,
  AthleteGuardian,
  Disclosure,
  DisclosureAcceptance,
  Profile,
  SeasonEnrollment,
  SeasonRegistration,
} from '@/types/database'

function line(label: string, value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  return `${label}: ${value}`
}

/**
 * Emails the family a copy of what they submitted, including the agreements
 * they signed.
 *
 * The Google Form this replaces ended with "A copy of your responses will be
 * emailed to the address you provided," so families are used to holding a
 * receipt. It matters more here than it did there: this copy is also the
 * family's record of a liability waiver they just signed.
 *
 * Reads through the service-role client because it runs after the RPC has
 * already authorized the submission, and it needs the disclosure text and
 * signature rows in one pass.
 */
export async function sendRegistrationConfirmation(params: {
  seasonRegistrationId: string
  athleteId: string
  userId: string
}) {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const supabase = createAdminSupabase()

  const [{ data: seasonRow }, { data: athleteRow }, { data: profileRow }] = await Promise.all([
    supabase.from('season_registrations').select('*').eq('id', params.seasonRegistrationId).maybeSingle(),
    supabase.from('athletes').select('*').eq('id', params.athleteId).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', params.userId).maybeSingle(),
  ])

  const season = seasonRow as SeasonRegistration | null
  const athlete = athleteRow as Athlete | null
  const profile = profileRow as Profile | null
  if (!season || !athlete || !profile?.email) return

  const [{ data: enrollmentRow }, { data: guardianRows }, { data: acceptanceRows }] = await Promise.all([
    supabase
      .from('season_enrollments')
      .select('*')
      .eq('season_registration_id', params.seasonRegistrationId)
      .eq('athlete_id', params.athleteId)
      .maybeSingle(),
    supabase.from('athlete_guardians').select('*').eq('athlete_id', params.athleteId).order('ordinal'),
    supabase
      .from('disclosure_acceptances')
      .select('*')
      .eq('season_registration_id', params.seasonRegistrationId)
      .eq('athlete_id', params.athleteId),
  ])

  const enrollment = enrollmentRow as SeasonEnrollment | null
  const guardians = (guardianRows ?? []) as AthleteGuardian[]
  const acceptances = (acceptanceRows ?? []) as DisclosureAcceptance[]

  const { data: disclosureRows } = acceptances.length
    ? await supabase
        .from('disclosures')
        .select('*')
        .in('id', acceptances.map((acceptance) => acceptance.disclosure_id))
    : { data: [] as Disclosure[] }

  const disclosureById = new Map(((disclosureRows ?? []) as Disclosure[]).map((row) => [row.id, row]))

  const athleteName = `${athlete.first_name} ${athlete.last_name}`
  const seasonYear = Number(season.registration_close_date.slice(0, 4))
  const age = ageOnDecember31(athlete.date_of_birth, seasonYear)

  const wrestlerLines = [
    line('Name', athleteName),
    line('Date of birth', athlete.date_of_birth),
    age != null ? `Age as of 12/31/${String(seasonYear).slice(2)}: ${age}` : null,
    line('Grade', enrollment?.grade),
    line('School', enrollment?.school),
    line('Current weight', enrollment?.weight_lbs != null ? `${enrollment.weight_lbs} lbs` : null),
    line('Shirt size', enrollment?.shirt_size),
    line('Years of experience', enrollment?.years_experience),
    line('Season commitment', enrollment?.season_commitment),
  ].filter(Boolean)

  const contactLines = [
    line('Phone', profile.phone),
    line('Address', [profile.street_address, profile.city, profile.state, profile.postal_code].filter(Boolean).join(', ')),
  ].filter(Boolean)

  const guardianBlocks = guardians.map((guardian) =>
    [
      `Parent / Guardian ${guardian.ordinal}`,
      line('  Name', guardian.name),
      line('  Relationship', guardian.relationship),
      line('  Phone', guardian.phone),
      line('  Email', guardian.email),
      line('  Interested in coaching', guardian.coach_interest),
    ]
      .filter(Boolean)
      .join('\n')
  )

  const agreementBlocks = acceptances.map((acceptance) => {
    const disclosure = disclosureById.get(acceptance.disclosure_id)
    const heading = `${disclosure?.title ?? 'Agreement'} (version ${disclosure?.version ?? '—'})`
    const signed = `Signed by ${acceptance.typed_signature ?? profile.full_name ?? 'guardian'} on ${new Date(
      acceptance.accepted_at
    ).toLocaleString('en-US', { timeZone: 'America/Chicago' })}`
    return [heading, signed, '', disclosure?.body ?? ''].join('\n')
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${ORG.domain}`
  const firstName = profile.full_name?.split(' ')[0] || 'there'

  const body = [
    `Hi ${firstName},`,
    '',
    `Here is your copy of ${athleteName}'s registration for ${season.season_label}.`,
    '',
    'WRESTLER',
    ...wrestlerLines,
    '',
    'CONTACT',
    ...contactLines,
    '',
    ...guardianBlocks.flatMap((block) => [block, '']),
    'AGREEMENTS SIGNED',
    '',
    ...agreementBlocks.flatMap((block) => [block, '']),
    `Check your registration status any time: ${siteUrl}/registration`,
    '',
    ORG.name,
  ].join('\n')

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`,
    to: profile.email,
    subject: `Your ${season.season_label} registration for ${athleteName}`,
    text: body,
  })

  if (error) {
    console.error('Registration confirmation email failed:', error.message)
  }
}
