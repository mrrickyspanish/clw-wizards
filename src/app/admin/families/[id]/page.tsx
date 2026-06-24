import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Athlete, Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AthleteDialog } from '../AthleteDialog'
import { FamilyActiveToggle } from '../FamilyActiveToggle'

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminSupabase()

  const { data: family } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'parent')
    .single()

  if (!family) notFound()
  const parent = family as Profile

  const { data: athleteRows } = await supabase
    .from('athletes')
    .select('*')
    .eq('parent_id', id)
    .order('first_name', { ascending: true })
  const athletes = (athleteRows ?? []) as Athlete[]

  return (
    <div>
      <Link
        href="/admin/families"
        className="mb-4 inline-flex items-center gap-1 text-sm text-clw-gray hover:text-clw-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to families
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-clw-gold">{parent.full_name ?? 'Unnamed parent'}</h1>
          <p className="text-sm text-clw-gray">{parent.email ?? '—'}</p>
        </div>
        <FamilyActiveToggle parentId={parent.id} isActive={parent.is_active} />
      </div>

      <Card className="mb-6 border-clw-gold/10 bg-clw-black">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-clw-gray">Contact & preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-clw-gray/70">Phone</p>
            <p className="text-clw-white">{parent.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">Practice group</p>
            <p className="text-clw-white">{parent.practice_group ?? '—'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">SMS opt-in</p>
            <p className="text-clw-white">{parent.sms_opt_in ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-clw-gray/70">Account</p>
            <p className="text-clw-white">{parent.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-display text-clw-white">
        Athletes <span className="text-sm text-clw-gray">({athletes.length})</span>
      </h2>

      {athletes.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-8 text-center">
          <p className="text-clw-gray">This family hasn’t added any athletes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {athletes.map((athlete) => (
            <Card key={athlete.id} className="border-clw-gold/10 bg-clw-black">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-clw-white">
                    {athlete.first_name} {athlete.last_name}
                  </CardTitle>
                  <p className="mt-1 text-xs text-clw-gray">Born {formatDate(athlete.date_of_birth)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    athlete.active
                      ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                      : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                  }
                >
                  {athlete.active ? 'active' : 'inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-clw-gray/70">Practice group</p>
                    <p className="text-clw-white">{athlete.practice_group}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Weight class</p>
                    <p className="text-clw-white">{athlete.weight_class ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">Shirt size</p>
                    <p className="text-clw-white">{athlete.shirt_size ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-clw-gray/70">USAW card</p>
                    <p className="text-clw-white">{athlete.usa_wrestling_card_number ?? '—'}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <AthleteDialog athlete={athlete} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
