import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'

import { createServerSupabase } from '@/lib/supabase/server'
import type { Athlete, AthleteDocument } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentControls } from './DocumentControls'

// The documents the club needs on file for every wrestler.
const REQUIRED_DOCS: { type: AthleteDocument['doc_type']; label: string }[] = [
  { type: 'birth_certificate', label: 'Birth certificate' },
  { type: 'usa_wrestling_card', label: 'USA Wrestling card' },
]

type DocStatus = 'verified' | 'pending' | 'missing'

function statusFor(doc: AthleteDocument | undefined): DocStatus {
  if (!doc) return 'missing'
  return doc.verified ? 'verified' : 'pending'
}

const STATUS_STYLES: Record<DocStatus, string> = {
  verified: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink',
  pending: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  missing: 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray',
}

const STATUS_LABELS: Record<DocStatus, string> = {
  verified: 'verified',
  pending: 'pending review',
  missing: 'not uploaded',
}

export default async function DocumentsPage() {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? ''

  const [{ data: athletes, error }, { data: docs }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, first_name, last_name')
      .eq('parent_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('athlete_documents')
      .select('*')
      .eq('parent_id', userId)
      .order('uploaded_at', { ascending: false }),
  ])

  const athleteRows = (athletes ?? []) as Pick<Athlete, 'id' | 'first_name' | 'last_name'>[]
  // Index documents by athlete + type for quick lookup.
  const docByKey = new Map<string, AthleteDocument>()
  for (const d of (docs ?? []) as AthleteDocument[]) {
    docByKey.set(`${d.athlete_id}:${d.doc_type}`, d)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-clw-gold-ink">Documents</h1>
        <p className="text-sm text-clw-gray">Required paperwork for each of your wrestlers.</p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load documents: {error.message}
        </p>
      )}

      {/* Documents attach to a wrestler, so there's nothing to upload until one exists. */}
      {!error && athleteRows.length === 0 && (
        <div className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-10 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clw-gold/10 text-clw-gold-ink">
            <UserPlus className="h-6 w-6" />
          </span>
          <p className="font-medium text-clw-white">Add a wrestler first</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-clw-gray">
            Documents like the birth certificate and USA Wrestling card are uploaded per wrestler, so add one to get started.
          </p>
          <Button asChild className="mt-5">
            <Link href="/athletes/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add wrestler
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {athleteRows.map((a) => (
          <Card key={a.id} className="card-depth border-clw-gold/10 bg-clw-black-3">
            <CardHeader>
              <CardTitle className="text-clw-white">
                {a.first_name} {a.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {REQUIRED_DOCS.map((req) => {
                const doc = docByKey.get(`${a.id}:${req.type}`)
                const status = statusFor(doc)
                return (
                  <div
                    key={req.type}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-clw-black px-4 py-3"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-clw-white">{req.label}</span>
                      {doc && <span className="block truncate text-xs text-clw-gray/70">{doc.file_name}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={STATUS_STYLES[status]}>
                        {STATUS_LABELS[status]}
                      </Badge>
                      <DocumentControls
                        userId={userId}
                        athleteId={a.id}
                        docType={req.type}
                        existingPath={doc?.file_url ?? null}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {athleteRows.length > 0 && (
        <p className="text-xs text-clw-gray/70">
          Accepted files: images or PDF, up to 10MB. A club admin reviews and verifies each document.
        </p>
      )}
    </div>
  )
}
