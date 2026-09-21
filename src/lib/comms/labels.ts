import type { CommType } from '@/types/database'

export const COMM_TYPE_LABELS: Record<CommType, string> = {
  tournament_reminder_wednesday: 'Tournament reminder (Wed)',
  tournament_reminder_weigh_in: 'Weigh-in alert',
  dues_reminder: 'Dues reminder',
  open_tournaments_digest: 'Open tournaments digest',
  general_blast: 'General message',
  registration_confirmation: 'Registration confirmation',
  welcome: 'Welcome',
}
