import { redirect } from 'next/navigation'

import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import type { AdminInvite, AdminScope, Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamControls } from './TeamControls'

const SCOPE_STYLES: Record<AdminScope, string> = {
  full: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  limited: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
}

export default async function AdminTeamPage() {
  const supabase = await createServerSupabase()
  // Middleware already blocks limited admins here; this is defense in depth.
  if (!(await isFullAdmin(supabase))) redirect('/admin')

  const nowIso = new Date().toISOString()
  const [{ data: admins }, { data: invites }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, admin_scope, is_active')
      .eq('role', 'admin')
      .order('created_at', { ascending: true }),
    supabase
      .from('admin_invites')
      .select('*')
      .is('redeemed_at', null)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false }),
  ])

  const adminRows = (admins ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'admin_scope' | 'is_active'>[]
  const inviteRows = (invites ?? []) as AdminInvite[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display text-clw-gold">Admin team</h1>
        <p className="text-sm text-clw-gray">
          Add and manage admin accounts. Full admins can edit the public website and manage the team; limited admins do
          everything else.
        </p>
      </div>

      <Card className="border-clw-gold/10 bg-clw-black">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-clw-gray">
            Current admins <span className="text-clw-gray/60">({adminRows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {adminRows.length === 0 ? (
            <p className="text-sm text-clw-gray">No admins yet.</p>
          ) : (
            adminRows.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-clw-black-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-clw-white">{a.full_name ?? 'Unnamed admin'}</p>
                  <p className="truncate text-sm text-clw-gray">{a.email ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!a.is_active && (
                    <Badge variant="outline" className="border-clw-gray/40 bg-clw-gray/10 text-clw-gray">
                      inactive
                    </Badge>
                  )}
                  <Badge variant="outline" className={SCOPE_STYLES[a.admin_scope ?? 'limited']}>
                    {a.admin_scope === 'full' ? 'Full access' : 'Limited access'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <TeamControls invites={inviteRows} />
    </div>
  )
}
