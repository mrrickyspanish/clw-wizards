import { createServerSupabase } from '@/lib/supabase/server'
import { ORG } from '@/config/org.config'
import { ComposeForm } from './ComposeForm'

export default async function AdminCommunicationsPage() {
  const supabase = await createServerSupabase()
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')
    .order('date', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Communications</h1>
        <p className="text-sm text-clw-gray">Compose and send an email to parents.</p>
      </div>

      <ComposeForm practiceGroups={ORG.practiceGroups} tournaments={tournaments ?? []} />
    </div>
  )
}
