import { UsersRound } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { FamilyGuardian, FamilyInvite, Profile } from '@/types/database'
import { FamilyControls } from './FamilyControls'
import { RemoveGuardianButton } from './RemoveGuardianButton'

function displayName(p: Pick<Profile, 'full_name' | 'email'> | undefined) {
  return p?.full_name || p?.email || 'Guardian'
}

export default async function FamilyPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  const nowIso = new Date().toISOString()
  const [{ data: myGuardians }, { data: joinedFamilies }, { data: invites }] = await Promise.all([
    supabase.from('family_guardians').select('*').eq('owner_id', userId),
    supabase.from('family_guardians').select('*').eq('guardian_id', userId),
    supabase
      .from('family_invites')
      .select('*')
      .eq('inviter_id', userId)
      .is('redeemed_at', null)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false }),
  ])

  const guardianRows = (myGuardians ?? []) as FamilyGuardian[]
  const joinedRows = (joinedFamilies ?? []) as FamilyGuardian[]
  const inviteRows = (invites ?? []) as FamilyInvite[]

  // Resolve names for the guardians in my family and the owners of families I joined.
  const profileIds = [...new Set([...guardianRows.map((g) => g.guardian_id), ...joinedRows.map((g) => g.owner_id)])]
  const profileMap = new Map<string, Pick<Profile, 'id' | 'full_name' | 'email'>>()
  if (profileIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
    for (const p of (profiles ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]) profileMap.set(p.id, p)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-clw-gold-ink">Family</h1>
        <p className="mt-1 text-sm text-clw-gray">
          Add another guardian — a co-parent or grandparent — so they can see the schedule, register wrestlers, and help
          manage the same family.
        </p>
      </div>

      {joinedRows.length > 0 && (
        <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
          <h2 className="mb-3 text-sm font-medium text-clw-white">You&apos;re a guardian in</h2>
          <ul className="space-y-2">
            {joinedRows.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl bg-clw-black px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-clw-gold/30 text-clw-gold-ink">
                  <UsersRound className="h-4 w-4" />
                </span>
                <span className="flex-1 text-clw-white">{displayName(profileMap.get(g.owner_id))}&apos;s family</span>
                <RemoveGuardianButton id={g.id} label={`${displayName(profileMap.get(g.owner_id))}'s family`} action="leave" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <h2 className="mb-3 text-sm font-medium text-clw-white">Guardians in your family</h2>
        {guardianRows.length === 0 ? (
          <p className="text-sm text-clw-gray">No one else yet. Invite a guardian below.</p>
        ) : (
          <ul className="space-y-2">
            {guardianRows.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl bg-clw-black px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-clw-gold/30 text-clw-gold-ink">
                  <UsersRound className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-clw-white">{displayName(profileMap.get(g.guardian_id))}</span>
                  <span className="block text-sm text-clw-gray">Co-guardian</span>
                </span>
                <RemoveGuardianButton id={g.id} label={displayName(profileMap.get(g.guardian_id))} action="remove" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <FamilyControls invites={inviteRows} />
    </div>
  )
}
