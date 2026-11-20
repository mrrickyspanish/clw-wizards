import { redirect } from 'next/navigation'

import { createServerSupabase } from '@/lib/supabase/server'
import { isFullAdmin } from '@/lib/auth/admin'
import type { AdminScope, Profile } from '@/types/database'
import { CHURCH_READ_ONLY } from '@/lib/demo-readonly'
import { churchRoleFor } from '@/lib/demo-roles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminRowActions } from './AdminRowActions'
import { AddAdminDialog } from './AddAdminDialog'

const SCOPE_STYLES: Record<AdminScope, string> = {
  full: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
  limited: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
}

export default async function AdminTeamPage() {
  const supabase = await createServerSupabase()
  // Middleware already blocks limited admins here; this is defense in depth.
  if (!(await isFullAdmin(supabase))) redirect('/admin')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? ''

  const { data: admins } = await supabase
    .from('profiles')
    .select('id, full_name, email, admin_scope, is_active')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })

  const adminRows = (admins ?? []) as Pick<Profile, 'id' | 'full_name' | 'email' | 'admin_scope' | 'is_active'>[]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">Admin team</h1>
          <p className="text-base text-clw-gray">
            {CHURCH_READ_ONLY
              ? "The people who can sign in to this dashboard. Each person's role decides what they can see."
              : 'Add and manage admin accounts. Full admins can edit the public website and manage the team; limited admins do everything else.'}
          </p>
        </div>
        <AddAdminDialog />
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
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl bg-clw-black-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-clw-white">{a.full_name ?? 'Unnamed admin'}</p>
                  <p className="truncate text-sm text-clw-gray">{a.email ?? (CHURCH_READ_ONLY ? 'No email' : '—')}</p>
                </div>
                {/* On a phone: badges on one line, then the actions as a full-width row. */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {!a.is_active && (
                      <Badge variant="outline" className="whitespace-nowrap border-clw-gray/40 bg-clw-gray/10 text-clw-gray">
                        inactive
                      </Badge>
                    )}
                    <Badge variant="outline" className={`whitespace-nowrap ${SCOPE_STYLES[a.admin_scope ?? 'limited']}`}>
                      {/* Church demo (UX scrub F22, callout 3): the role name, not full or limited. */}
                      {(CHURCH_READ_ONLY && churchRoleFor(a.email)?.label) || (a.admin_scope === 'full' ? 'Full access' : 'Limited access')}
                    </Badge>
                  </div>
                  <AdminRowActions
                    id={a.id}
                    name={a.full_name ?? a.email ?? 'this admin'}
                    scope={a.admin_scope ?? 'limited'}
                    isActive={a.is_active}
                    isSelf={a.id === currentUserId}
                    church={CHURCH_READ_ONLY}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  )
}
