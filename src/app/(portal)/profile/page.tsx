import Link from 'next/link'
import { FolderOpen, Users, ChevronRight } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import { ContactPrefsForm } from '../dashboard/ContactPrefsForm'
import { SignOutButton } from '@/components/layout/SignOutButton'

function initials(name: string | null): string {
  if (!name) return 'CLW'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const LINKS = [
  { href: '/athletes', label: 'My wrestlers', icon: Users },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
]

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const { data: profile } = auth.user
    ? await supabase
        .from('profiles')
        .select('full_name, email, phone, sms_opt_in, role')
        .eq('id', auth.user.id)
        .single()
    : { data: null }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="hidden font-display text-3xl text-clw-gold-ink md:block">Profile</h1>

      {/* Identity */}
      <div className="flex items-center gap-4 rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-clw-gold/30 font-display text-xl text-clw-gold-ink">
          {initials(profile?.full_name ?? null)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl text-clw-white">{profile?.full_name ?? 'Wizard family'}</p>
          <p className="truncate text-sm text-clw-gray">{profile?.email ?? ''}</p>
          <p className="mt-0.5 text-xs capitalize text-clw-gold-ink">{profile?.role ?? 'parent'}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="overflow-hidden rounded-2xl border border-clw-gold/10 bg-clw-black-3">
        {LINKS.map((link, i) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-5 py-4 active:bg-clw-black ${
                i > 0 ? 'border-t border-clw-gold/10' : ''
              }`}
            >
              <span className="flex items-center gap-3 text-clw-white">
                <Icon className="h-5 w-5 text-clw-gold-ink" /> {link.label}
              </span>
              <ChevronRight className="h-5 w-5 text-clw-gray" />
            </Link>
          )
        })}
      </div>

      {/* Contact & SMS */}
      <div className="rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
        <h2 className="mb-4 text-sm font-medium text-clw-gray">Contact & SMS preferences</h2>
        <ContactPrefsForm initialPhone={profile?.phone ?? null} initialSmsOptIn={profile?.sms_opt_in ?? false} />
      </div>

      <SignOutButton />
    </div>
  )
}
