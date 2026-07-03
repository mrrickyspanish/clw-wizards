import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Athlete } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function ageFromDob(dob: string): number {
  const birth = new Date(`${dob}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm uppercase tracking-wide text-clw-gray/70">{label}</dt>
      <dd className="text-clw-white">{value || '—'}</dd>
    </div>
  )
}

export default async function AthletesPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('parent_id', auth.user?.id ?? '')
    .order('created_at', { ascending: true })

  const rows = (athletes ?? []) as Athlete[]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-clw-gold-ink">My Athletes</h1>
          <p className="text-sm text-clw-gray">Your registered wrestlers and their details.</p>
        </div>
        {rows.length > 0 && (
          <Button asChild size="sm">
            <Link href="/athletes/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add wrestler
            </Link>
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load athletes: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-10 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clw-gold/10 text-clw-gold-ink">
            <UserPlus className="h-6 w-6" />
          </span>
          <p className="font-medium text-clw-white">No wrestlers added yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-clw-gray">
            Add your first wrestler to register for practices and tournaments and to upload their documents.
          </p>
          <Button asChild className="mt-5">
            <Link href="/athletes/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add wrestler
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((a) => (
          <Card key={a.id} className="border-clw-gold/10 bg-clw-black-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-clw-white">
                  {a.first_name} {a.last_name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    a.active
                      ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink'
                      : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                  }
                >
                  {a.active ? 'active' : 'inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Practice group" value={a.practice_group} />
                <Detail
                  label="Date of birth"
                  value={`${formatDate(a.date_of_birth)} (age ${ageFromDob(a.date_of_birth)})`}
                />
                <Detail label="Weight class" value={a.weight_class} />
                <Detail label="Shirt size" value={a.shirt_size} />
                <Detail label="USA Wrestling card #" value={a.usa_wrestling_card_number} />
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length > 0 && (
        <p className="text-sm text-clw-gray/70">
          Need to edit a wrestler&apos;s details? Contact a club admin. Self-service editing is coming in a follow-up build.
        </p>
      )}
    </div>
  )
}
