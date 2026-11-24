import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import {
  EXPORT_HEADERS,
  exportFileName,
  registrationRows,
  toCsv,
  type ExportAthlete,
  type ExportDues,
  type ExportEnrollment,
  type ExportGuardian,
  type ExportParent,
  type ExportSignature,
} from '@/lib/registration-export'

// GET /admin/registrations/export: the current season's registrations as a
// spreadsheet (CSV, opens in Excel). Admins only. The middleware already
// keeps everyone else out of /admin; this checks again because the file holds
// every family's contact details.
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return new Response('Sign in first.', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).single()
  if (profile?.role !== 'admin') return new Response('Admins only.', { status: 403 })

  const admin = createAdminSupabase()
  // The current season, the same way the Registrations page picks it.
  const { data: seasonRows, error: seasonError } = await admin
    .from('season_registrations')
    .select('id, season_label')
    .order('registration_close_date', { ascending: false })
    .limit(1)
  if (seasonError) return new Response('Could not load the season. Try again.', { status: 500 })
  const season = (seasonRows ?? [])[0] as { id: string; season_label: string } | undefined
  if (!season) return new Response('No season is set up yet.', { status: 404 })

  const { data: enrollmentRows, error: enrollmentError } = await admin
    .from('season_enrollments')
    .select(
      'athlete_id, parent_id, status, submitted_at, dues_payment_id, usa_card_document_id, card_override_at, grade, school, weight_lbs, shirt_size, years_experience, season_commitment'
    )
    .eq('season_registration_id', season.id)
  if (enrollmentError) return new Response('Could not load registrations. Try again.', { status: 500 })
  const enrollments = (enrollmentRows ?? []) as ExportEnrollment[]

  const athleteIds = [...new Set(enrollments.map((e) => e.athlete_id))]
  const parentIds = [...new Set(enrollments.map((e) => e.parent_id))]
  const duesIds = [...new Set(enrollments.map((e) => e.dues_payment_id).filter((id): id is string => Boolean(id)))]
  const none = Promise.resolve({ data: [], error: null })

  const [athletes, parents, dues, guardians, required, documents] = await Promise.all([
    athleteIds.length
      ? admin
          .from('athletes')
          .select(
            'id, first_name, last_name, date_of_birth, age_division, practice_group, shirt_size, usa_wrestling_card_number, usa_wrestling_card_url, birth_certificate_url, birth_certificate_on_file'
          )
          .in('id', athleteIds)
      : none,
    parentIds.length
      ? admin
          .from('profiles')
          .select('id, full_name, email, phone, street_address, city, state, postal_code')
          .in('id', parentIds)
      : none,
    duesIds.length
      ? admin.from('dues_payments').select('id, amount_cents, amount_paid_cents, status, payment_plan').in('id', duesIds)
      : none,
    athleteIds.length
      ? admin
          .from('athlete_guardians')
          .select('athlete_id, ordinal, name, relationship, phone, email, coach_interest')
          .in('athlete_id', athleteIds)
      : none,
    admin.from('disclosures').select('id').eq('active', true).eq('required', true),
    athleteIds.length
      ? admin.from('athlete_documents').select('athlete_id, doc_type').in('athlete_id', athleteIds)
      : none,
  ])
  const failed = [athletes, parents, dues, guardians, required, documents].find((r) => r.error)
  if (failed) return new Response('Could not load registrations. Try again.', { status: 500 })

  const requiredIds = ((required.data ?? []) as { id: string }[]).map((d) => d.id)
  const { data: signatureRows, error: signatureError } =
    requiredIds.length && athleteIds.length
      ? await admin
          .from('disclosure_acceptances')
          .select('athlete_id, accepted_at, typed_signature')
          .eq('season_registration_id', season.id)
          .in('disclosure_id', requiredIds)
          .in('athlete_id', athleteIds)
      : { data: [], error: null }
  if (signatureError) return new Response('Could not load registrations. Try again.', { status: 500 })

  const docs = (documents.data ?? []) as { athlete_id: string; doc_type: string }[]
  const rows = registrationRows({
    enrollments,
    athletes: (athletes.data ?? []) as ExportAthlete[],
    parents: (parents.data ?? []) as ExportParent[],
    dues: (dues.data ?? []) as ExportDues[],
    guardians: (guardians.data ?? []) as ExportGuardian[],
    signatures: (signatureRows ?? []) as ExportSignature[],
    cardUploads: new Set(docs.filter((d) => d.doc_type === 'usa_wrestling_card').map((d) => d.athlete_id)),
    birthCertificateUploads: new Set(docs.filter((d) => d.doc_type === 'birth_certificate').map((d) => d.athlete_id)),
  })

  return new Response(toCsv(EXPORT_HEADERS, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportFileName(season.season_label, new Date())}"`,
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex',
    },
  })
}
