import { createAdminSupabase } from '@/lib/supabase/admin'

export const SMS_CONSENT_TEXT =
  'By checking this box, you agree to receive SMS text messages from Crystal Lake Wizards Wrestling Club ' +
  'about tournaments, weigh-ins, and dues reminders. Message frequency varies. Message and data rates may ' +
  'apply. Reply STOP to opt out at any time, HELP for help.'

export async function handleOptIn(profileId: string) {
  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from('profiles')
    .update({
      sms_opt_in: true,
      sms_opt_in_at: new Date().toISOString(),
      consent_text: SMS_CONSENT_TEXT,
    })
    .eq('id', profileId)

  if (error) throw error
}

export async function handleOptOut(profileId: string) {
  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from('profiles')
    .update({ sms_opt_in: false })
    .eq('id', profileId)

  if (error) throw error
}
