'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'

// One-off dated club events (banquet, parent night, fundraiser…). A season
// registration is created in the same familiar editor, with a companion record
// for its registration window, dues, and document requirements.

const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(160),
    event_type: z.enum(['event', 'banquet', 'parent_night', 'fundraiser', 'meeting', 'season_registration', 'other']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required'),
    start_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable().or(z.literal('')),
    end_time: z.string().regex(/^\d{1,2}:\d{2}$/).optional().nullable().or(z.literal('')),
    location: z.string().trim().max(240).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    practice_group: z.string().trim().optional().nullable(),
    active: z.boolean(),
    season_label: z.string().trim().max(40).optional().nullable(),
    registration_open_date: z.string().optional().nullable(),
    registration_close_date: z.string().optional().nullable(),
    dues_amount_cents: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
    dues_due_date: z.string().optional().nullable(),
    instructions: z.string().trim().max(3000).optional().nullable(),
    require_usa_card: z.boolean().optional(),
    // The season's price ladder, earliest window first. Empty means a single
    // flat price at dues_amount_cents.
    price_tiers: z
      .array(
        z.object({
          label: z.string().trim().min(1, 'Each price step needs a name.').max(60),
          starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid start date.'),
          ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid end date.'),
          amount_cents: z.coerce.number().int().min(0).max(1_000_000),
        })
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.event_type !== 'season_registration') return

    if (!values.season_label) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['season_label'], message: 'Season name is required.' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.registration_open_date ?? '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registration_open_date'], message: 'Opening date is required.' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.registration_close_date ?? '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registration_close_date'], message: 'Closing date is required.' })
    }
    if (
      values.registration_open_date &&
      values.registration_close_date &&
      values.registration_close_date < values.registration_open_date
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registration_close_date'], message: 'Closing date must be on or after the opening date.' })
    }
    if (values.dues_due_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.dues_due_date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dues_due_date'], message: 'Enter a valid dues due date.' })
    }

    // Mirrors the table's own CHECK and exclusion constraints, so a bad ladder
    // is reported as a readable message instead of a Postgres constraint error.
    const tiers = [...(values.price_tiers ?? [])].sort((a, b) => a.starts_on.localeCompare(b.starts_on))
    tiers.forEach((tier, index) => {
      if (tier.ends_on < tier.starts_on) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price_tiers', index, 'ends_on'],
          message: `"${tier.label}" ends before it starts.`,
        })
      }
      if (
        values.registration_open_date &&
        values.registration_close_date &&
        (tier.starts_on < values.registration_open_date || tier.ends_on > values.registration_close_date)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price_tiers', index, 'starts_on'],
          message: `"${tier.label}" falls outside the registration window.`,
        })
      }
      const previous = tiers[index - 1]
      if (previous && tier.starts_on <= previous.ends_on) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price_tiers', index, 'starts_on'],
          message: `"${tier.label}" overlaps "${previous.label}". Price windows cannot share a date.`,
        })
      }
    })
  })

export type EventInput = z.input<typeof eventSchema>
export type ActionResult = { ok: true } | { ok: false; error: string }

function normalizeEvent(values: z.output<typeof eventSchema>) {
  return {
    title: values.title,
    event_type: values.event_type,
    date: values.date,
    start_time: values.event_type === 'season_registration' ? null : values.start_time || null,
    end_time: values.event_type === 'season_registration' ? null : values.end_time || null,
    location: values.location || null,
    notes: values.notes || null,
    practice_group: values.event_type === 'season_registration' ? null : values.practice_group || null,
    active: values.active,
  }
}

function normalizeSeason(values: z.output<typeof eventSchema>, eventId: string) {
  return {
    event_id: eventId,
    season_label: values.season_label!,
    registration_open_date: values.registration_open_date!,
    registration_close_date: values.registration_close_date!,
    dues_amount_cents: values.dues_amount_cents ?? 0,
    dues_due_date: values.dues_due_date || null,
    instructions: values.instructions || null,
    require_usa_card: values.require_usa_card ?? true,
  }
}

/**
 * Replaces a season's price ladder wholesale. Safe to re-run: the price a
 * family pays is copied into their dues_payments row at submission time, so
 * editing tiers later never re-prices an enrollment that already exists.
 */
async function replacePriceTiers(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  seasonId: string,
  tiers: z.output<typeof eventSchema>['price_tiers']
): Promise<string | null> {
  const { error: clearError } = await supabase
    .from('season_price_tiers')
    .delete()
    .eq('season_registration_id', seasonId)
  if (clearError) return clearError.message

  if (!tiers?.length) return null

  const { error } = await supabase.from('season_price_tiers').insert(
    tiers.map((tier) => ({
      season_registration_id: seasonId,
      label: tier.label,
      starts_on: tier.starts_on,
      ends_on: tier.ends_on,
      amount_cents: tier.amount_cents,
    }))
  )
  return error?.message ?? null
}

function parse(values: EventInput): z.output<typeof eventSchema> | ActionResult {
  const result = eventSchema.safeParse(values)
  if (!result.success) return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid input' }
  return result.data
}

function revalidateEventSurfaces() {
  revalidatePath('/admin/practices')
  revalidatePath('/admin/registrations')
  revalidatePath('/dashboard')
  revalidatePath('/registration')
  revalidatePath('/events')
  revalidatePath('/')
}

export async function createEvent(values: EventInput): Promise<ActionResult> {
  const parsed = parse(values)
  if ('ok' in parsed) return parsed

  const supabase = await createServerSupabase()
  const { data: event, error } = await supabase
    .from('club_events')
    .insert(normalizeEvent(parsed))
    .select('id')
    .single()

  if (error || !event) return { ok: false, error: error?.message ?? 'Unable to create event.' }

  if (parsed.event_type === 'season_registration') {
    const { data: season, error: seasonError } = await supabase
      .from('season_registrations')
      .insert(normalizeSeason(parsed, event.id))
      .select('id')
      .single()
    if (seasonError || !season) {
      await supabase.from('club_events').delete().eq('id', event.id)
      return { ok: false, error: seasonError?.message ?? 'Unable to create the season.' }
    }

    const tierError = await replacePriceTiers(supabase, season.id, parsed.price_tiers)
    if (tierError) {
      await supabase.from('season_registrations').delete().eq('id', season.id)
      await supabase.from('club_events').delete().eq('id', event.id)
      return { ok: false, error: tierError }
    }
  }

  revalidateEventSurfaces()
  return { ok: true }
}

export async function updateEvent(id: string, values: EventInput): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing event id' }
  const parsed = parse(values)
  if ('ok' in parsed) return parsed

  const supabase = await createServerSupabase()
  const { data: existingSeason } = await supabase
    .from('season_registrations')
    .select('id')
    .eq('event_id', id)
    .maybeSingle()

  if (existingSeason && parsed.event_type !== 'season_registration') {
    const { count } = await supabase
      .from('season_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('season_registration_id', existingSeason.id)

    if ((count ?? 0) > 0) {
      return { ok: false, error: 'This season already has wrestler registrations and cannot be changed into a standard event.' }
    }
  }

  const { error } = await supabase.from('club_events').update(normalizeEvent(parsed)).eq('id', id)
  if (error) return { ok: false, error: error.message }

  if (parsed.event_type === 'season_registration') {
    const { data: season, error: seasonError } = await supabase
      .from('season_registrations')
      .upsert(normalizeSeason(parsed, id), { onConflict: 'event_id' })
      .select('id')
      .single()
    if (seasonError || !season) return { ok: false, error: seasonError?.message ?? 'Unable to save the season.' }

    const tierError = await replacePriceTiers(supabase, season.id, parsed.price_tiers)
    if (tierError) return { ok: false, error: tierError }
  } else if (existingSeason) {
    const { error: deleteError } = await supabase.from('season_registrations').delete().eq('id', existingSeason.id)
    if (deleteError) return { ok: false, error: deleteError.message }
  }

  revalidateEventSurfaces()
  return { ok: true }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: 'Missing event id' }
  const supabase = await createServerSupabase()

  const { data: season } = await supabase
    .from('season_registrations')
    .select('id')
    .eq('event_id', id)
    .maybeSingle()

  if (season) {
    const { count } = await supabase
      .from('season_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('season_registration_id', season.id)

    if ((count ?? 0) > 0) {
      return { ok: false, error: 'This season has wrestler registrations. Make it inactive instead of deleting it.' }
    }

    const { error: seasonError } = await supabase.from('season_registrations').delete().eq('id', season.id)
    if (seasonError) return { ok: false, error: seasonError.message }
  }

  const { error } = await supabase.from('club_events').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateEventSurfaces()
  return { ok: true }
}
