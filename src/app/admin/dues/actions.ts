'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'

export type DuesActionResult = { ok: true } | { ok: false; error: string }

export type DuesBalanceState = 'standard' | 'overdue' | 'waived'

async function assertAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Admin access required' }

  return { ok: true, userId: user.id }
}

const duesSchema = z
  .object({
    amount_cents: z.number().int().min(0, 'Amount billed cannot be negative').max(10_000_000),
    amount_paid_cents: z.number().int().min(0, 'Amount paid cannot be negative').max(10_000_000),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid due date')
      .or(z.literal(''))
      .optional()
      .nullable(),
    payment_plan: z.boolean(),
    balance_state: z.enum(['standard', 'overdue', 'waived']),
    waived_note: z.string().trim().max(500, 'Waiver note must be 500 characters or fewer').optional().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.amount_paid_cents > values.amount_cents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount_paid_cents'],
        message: 'Recorded payments cannot exceed the amount billed.',
      })
    }

    if (values.balance_state === 'waived' && !values.waived_note?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['waived_note'],
        message: 'Add a short note explaining the waiver.',
      })
    }
  })

export type DuesInput = z.input<typeof duesSchema>

export async function updateDuesPayment(id: string, values: DuesInput): Promise<DuesActionResult> {
  const auth = await assertAdmin()
  if (!auth.ok) return auth
  if (!id) return { ok: false, error: 'Missing dues record id' }

  let parsed: z.output<typeof duesSchema>
  try {
    parsed = duesSchema.parse(values)
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? 'Invalid input' }
    throw err
  }

  const admin = createAdminSupabase()
  const { data: current, error: currentError } = await admin
    .from('dues_payments')
    .select('id, status, waived_at')
    .eq('id', id)
    .maybeSingle()

  if (currentError) return { ok: false, error: currentError.message }
  if (!current) return { ok: false, error: 'Dues record not found.' }

  let status: 'pending' | 'partial' | 'paid' | 'waived' | 'overdue'
  if (parsed.balance_state === 'waived') {
    status = 'waived'
  } else if (parsed.amount_cents === 0 || parsed.amount_paid_cents >= parsed.amount_cents) {
    status = 'paid'
  } else if (parsed.amount_paid_cents > 0) {
    status = 'partial'
  } else if (parsed.balance_state === 'overdue') {
    status = 'overdue'
  } else {
    status = 'pending'
  }

  const { error } = await admin
    .from('dues_payments')
    .update({
      amount_cents: parsed.amount_cents,
      amount_paid_cents: parsed.amount_paid_cents,
      due_date: parsed.due_date || null,
      payment_plan: parsed.payment_plan,
      status,
      waived_by: status === 'waived' ? auth.userId : null,
      waived_at:
        status === 'waived'
          ? current.status === 'waived' && current.waived_at
            ? current.waived_at
            : new Date().toISOString()
          : null,
      waived_note: status === 'waived' ? parsed.waived_note?.trim() || null : null,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/dues')
  revalidatePath('/admin/registrations')
  revalidatePath('/dues')
  revalidatePath('/registration')
  revalidatePath('/dashboard')

  return { ok: true }
}
