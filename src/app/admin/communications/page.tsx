import { createServerSupabase } from '@/lib/supabase/server'
import { chicagoDateString } from '@/lib/chicago-time'
import { ORG } from '@/config/org.config'
import { commsQueueStatus } from '@/lib/qstash'
import { smsReady } from '@/lib/twilio/sender'
import { ComposeForm } from './ComposeForm'
import { CommsHistory } from './CommsHistory'
import { BoardCopyManager } from './BoardCopyManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BoardCopyRecipient } from '@/types/database'

export default async function AdminCommunicationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  // ?tab=history opens History, e.g. from the link shown after a send.
  const { tab } = await searchParams
  const openTab = tab === 'history' || tab === 'board' ? tab : 'compose'
  const supabase = await createServerSupabase()
  const [{ data: tournaments }, { data: events }, { data: parents }, { data: boardRows }] = await Promise.all([
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
    supabase.from('board_copy_recipients').select('id, name, email, created_at').order('name', { ascending: true }),
  ])
  const board = (boardRows ?? []) as BoardCopyRecipient[]

  const queue = commsQueueStatus()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Communications</h1>
        <p className="text-base text-clw-gray">Send families an email or a text, and see what went out.</p>
      </div>

      <Tabs key={openTab} defaultValue={openTab}>
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="board">Board copy</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <ComposeForm
            practiceGroups={ORG.practiceGroups}
            tournaments={tournaments ?? []}
            events={events ?? []}
            boardNames={board.map((b) => b.name)}
            parents={parents ?? []}
            queueReady={queue.ready}
            queueMissing={queue.missing}
            smsReady={smsReady()}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6 max-w-3xl">
          <CommsHistory />
        </TabsContent>

        <TabsContent value="board" className="mt-6">
          <BoardCopyManager recipients={board} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
