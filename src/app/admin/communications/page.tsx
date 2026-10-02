import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import { ORG } from '@/config/org.config'
import { commsQueueStatus } from '@/lib/qstash'
import { ComposeForm } from './ComposeForm'
import { CommsHistory } from './CommsHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function AdminCommunicationsPage() {
  const supabase = await createServerSupabase()
  const [{ data: tournaments }, { data: events }, { data: parents }] = await Promise.all([
    supabase.from('tournaments').select('id, name').order('date', { ascending: false }),
    // Upcoming club events (not the season registration itself) for the
    // "About an event" picker.
    supabase
      .from('club_events')
      .select('id, title, date, start_time, end_time, location, notes')
      .eq('active', true)
      .neq('event_type', 'season_registration')
      .gte('date', chicagoDateString())
      .order('date', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'parent')
      .eq('is_active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true }),
  ])

  const queue = commsQueueStatus()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Communications</h1>
        <p className="text-base text-clw-gray">Compose and send an email to parents.</p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <ComposeForm
            practiceGroups={ORG.practiceGroups}
            tournaments={tournaments ?? []}
            events={events ?? []}
            parents={parents ?? []}
            queueReady={queue.ready}
            queueMissing={queue.missing}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6 max-w-3xl">
          <CommsHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
