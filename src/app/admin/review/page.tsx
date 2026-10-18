import Link from 'next/link'
import { Inbox } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import { reviewQueue } from '@/lib/documents/review-queue'
import { DOC_LABELS } from '@/lib/documents/upload-notice'
import { Badge } from '@/components/ui/badge'
import { ReviewItem } from './ReviewItem'

function formatUploaded(value: string) {
  return new Date(value).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * To review: every USA card and birth certificate a family uploaded that
 * nobody has checked yet, newest first, with everything needed to clear it on
 * one screen. Upload emails link straight to a row here (#doc-<id>).
 */
export default async function AdminReviewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  const filter = type === 'cards' ? 'usa_wrestling_card' : type === 'birth-certificates' ? 'birth_certificate' : null

  const supabase = createAdminSupabase()
  const queue = await reviewQueue(supabase)
  const shown = filter ? queue.filter((doc) => doc.doc_type === filter) : queue
  const cardCount = queue.filter((doc) => doc.doc_type === 'usa_wrestling_card').length

  const athleteIds = [...new Set(shown.map((doc) => doc.athlete_id))]
  const { data: athleteRows } = athleteIds.length
    ? await supabase
        .from('athletes')
        .select('id, first_name, last_name, parent_id, usa_wrestling_card_number, birth_certificate_on_file')
        .in('id', athleteIds)
    : { data: [] }
  const athleteById = new Map((athleteRows ?? []).map((a) => [a.id, a]))
  const profileIds = [...new Set([...shown.map((doc) => doc.parent_id), ...(athleteRows ?? []).map((a) => a.parent_id)])]
  const { data: profileRows } = profileIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
    : { data: [] }
  const nameById = new Map((profileRows ?? []).map((p) => [p.id, p.full_name || p.email || 'A parent']))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-clw-gold">To review</h1>
        <p className="max-w-2xl text-base text-clw-gray">
          USA cards and birth certificates families uploaded that haven&apos;t been checked yet, newest first. Verify the
          ones that are right. Reject the ones that aren&apos;t, and the family is emailed to upload a new one.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterLink href="/admin/review" active={!filter}>
          All ({queue.length})
        </FilterLink>
        <FilterLink href="/admin/review?type=cards" active={filter === 'usa_wrestling_card'}>
          USA cards ({cardCount})
        </FilterLink>
        <FilterLink href="/admin/review?type=birth-certificates" active={filter === 'birth_certificate'}>
          Birth certificates ({queue.length - cardCount})
        </FilterLink>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clw-gold/10 text-clw-gold">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="text-base text-clw-white">Nothing to review.</p>
          <p className="mx-auto mt-1 max-w-sm text-base text-clw-gray">
            New uploads show up here, and the people on Communications &gt; Upload notices get an email for each one.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((doc) => {
            const athlete = athleteById.get(doc.athlete_id)
            const wrestlerName = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Wrestler'
            const docType = doc.doc_type as 'usa_wrestling_card' | 'birth_certificate'
            return (
              <li
                key={doc.id}
                id={`doc-${doc.id}`}
                className="scroll-mt-24 space-y-3 rounded-lg border border-clw-gold/10 bg-clw-black p-4 target:border-clw-gold/60 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {athlete ? (
                      <Link
                        href={`/admin/families/${athlete.parent_id}`}
                        className="text-lg font-semibold text-clw-white hover:text-clw-gold"
                      >
                        {wrestlerName}
                      </Link>
                    ) : (
                      <p className="text-lg font-semibold text-clw-white">{wrestlerName}</p>
                    )}
                    <p className="text-base text-clw-gray">
                      Uploaded {formatUploaded(doc.uploaded_at)} by {nameById.get(doc.parent_id) ?? 'a parent'}
                    </p>
                    <p className="truncate text-sm text-clw-gray">{doc.file_name}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${
                      docType === 'usa_wrestling_card'
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                        : 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                    }`}
                  >
                    {DOC_LABELS[docType]}
                  </Badge>
                </div>
                {docType === 'birth_certificate' && athlete?.birth_certificate_on_file && (
                  <p className="text-base text-clw-gray">The club also has this wrestler marked as on file.</p>
                )}
                <ReviewItem
                  documentId={doc.id}
                  docType={docType}
                  wrestlerName={wrestlerName}
                  cardNumber={athlete?.usa_wrestling_card_number ?? null}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex min-h-11 items-center rounded-full border border-clw-gold/40 bg-clw-gold/10 px-4 text-sm text-clw-gold'
          : 'inline-flex min-h-11 items-center rounded-full border border-clw-gold/10 px-4 text-sm text-clw-gray hover:text-clw-gold'
      }
    >
      {children}
    </Link>
  )
}
