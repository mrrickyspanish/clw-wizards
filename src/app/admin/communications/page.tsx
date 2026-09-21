import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import { commsQueueStatus } from '@/lib/qstash'
import { ComposeForm } from './ComposeForm'

export default async function AdminCommunicationsPage() {
  const supabase = await createServerSupabase()
  const [{ data: tournaments }, { data: parents }] = await Promise.all([
    supabase.from('tournaments').select('id, name').order('date', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'parent')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  const queue = commsQueueStatus()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Communications</h1>
        <p className="text-base text-clw-gray">Compose and send an email to parents.</p>
      </div>

      <ComposeForm
        practiceGroups={ORG.practiceGroups}
        tournaments={tournaments ?? []}
        parents={parents ?? []}
        queueReady={queue.ready}
        queueMissing={queue.missing}
      />
    </div>
  )
}
