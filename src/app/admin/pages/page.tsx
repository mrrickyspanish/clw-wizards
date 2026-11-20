import Link from 'next/link'
import { FilePlus2, Inbox } from 'lucide-react'

import { SAMPLE_PAGES, templateFor, type PageStatus } from '@/lib/demo-pages'
import { pagesAccess, visiblePages } from './access'

export const dynamic = 'force-dynamic'

const CHIP: Record<PageStatus, string> = {
  Published: 'border-emerald-400/50 text-emerald-300',
  Draft: 'border-clw-gray/40 text-clw-gray',
  'In review': 'border-clw-gold/60 text-clw-gold',
}

export default async function PagesListPage() {
  const { mode, ministry } = await pagesAccess()
  const pages = visiblePages(mode, ministry)
  const waiting = SAMPLE_PAGES.filter((p) => p.status === 'In review').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-clw-gold">Pages</h1>
          <p className="mt-1 max-w-2xl text-base text-clw-gray">
            {mode === 'ministry'
              ? `You can edit ${ministry}'s page. Your changes go to a Church Admin for approval before they appear on the website.`
              : mode === 'editor'
                ? 'Create and edit pages from the church templates. Nothing goes live until a Church Admin approves it.'
                : 'Every page on the church website. Pages are built from three fixed templates; staff fill them in.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'full' && (
            <Link
              href="/admin/pages/review"
              prefetch={false}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-clw-gold/50 px-5 text-base font-semibold text-clw-gold hover:bg-clw-black-3"
            >
              <Inbox className="h-4 w-4" /> Approval queue ({waiting})
            </Link>
          )}
          {mode !== 'ministry' && (
            <Link
              href="/admin/pages/new"
              prefetch={false}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-clw-gold px-5 text-base font-semibold text-clw-black hover:bg-clw-gold-l"
            >
              <FilePlus2 className="h-4 w-4" /> Insert New Page
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-clw-gold/20">
        <div className="hidden grid-cols-[2fr_1.2fr_1.2fr_1fr_1.2fr] gap-4 bg-clw-black-3 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-clw-gray md:grid">
          <span>Page</span>
          <span>Template</span>
          <span>Ministry</span>
          <span>Status</span>
          <span>Last edited</span>
        </div>
        {pages.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/pages/edit?page=${p.slug}`}
            prefetch={false}
            className="grid gap-1 border-t border-clw-gold/10 px-4 py-4 text-base hover:bg-clw-black-3 md:grid-cols-[2fr_1.2fr_1.2fr_1fr_1.2fr] md:items-center md:gap-4"
          >
            <span>
              <span className="block font-semibold text-clw-white">{p.title}</span>
              <span className="block text-sm text-clw-gray">/{p.slug}</span>
            </span>
            <span className="text-clw-gray">{templateFor(p.template).name}</span>
            <span className="text-clw-gray">{p.ministry}</span>
            <span>
              <span className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${CHIP[p.status]}`}>{p.status}</span>
            </span>
            <span className="text-sm text-clw-gray">
              {p.edited} · {p.editedBy}
            </span>
          </Link>
        ))}
      </div>
      <p className="text-sm text-clw-gray">Sample pages for the demo. Opening one shows the editor; nothing is saved.</p>
    </div>
  )
}
