import { createServerSupabase } from '@/lib/supabase/server'
import type { Athlete, AthleteDocument } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  verified: 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold',
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
    supabase.from('athlete_documents').select('*').eq('parent_id', userId),
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
        <h1 className="text-2xl font-display text-clw-gold">Documents</h1>
        <p className="text-sm text-clw-gray">Required paperwork for each of your wrestlers.</p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load documents: {error.message}
        </p>
      )}

      {!error && athleteRows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No athletes on file yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {athleteRows.map((a) => (
          <Card key={a.id} className="border-clw-gold/10 bg-clw-black">
            <CardHeader>
              <CardTitle className="text-clw-white">
                {a.first_name} {a.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {REQUIRED_DOCS.map((req) => {
                const doc = docByKey.get(`${a.id}:${req.type}`)
                const status = statusFor(doc)
                return (
                  <div key={req.type} className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm text-clw-white">{req.label}</span>
                      {doc && <span className="block text-xs text-clw-gray/70">{doc.file_name}</span>}
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[status]}>
                      {STATUS_LABELS[status]}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {athleteRows.length > 0 && (
        <p className="text-xs text-clw-gray/70">
          To submit or update a document, contact a club admin — self-service upload is coming in a follow-up build.
        </p>
      )}
    </div>
  )
}
