import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MINISTRY_OPTIONS, samplePage, slugFor, starterValues, templateFor } from '@/lib/demo-pages'
import { pagesAccess } from '../access'
import { PageEditor } from './PageEditor'

export const dynamic = 'force-dynamic'

export default async function EditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; template?: string; title?: string; ministry?: string }>
}) {
  const { mode, ministry: myMinistry } = await pagesAccess()
  const q = await searchParams
  const existing = samplePage(q.page)

  let props
  if (existing) {
    // Ministry Admins open only their own ministry's pages.
    if (mode === 'ministry' && existing.ministry !== myMinistry) notFound()
    props = {
      template: templateFor(existing.template),
      initial: existing.values,
      initialHidden: existing.hidden ?? [],
      title: existing.title,
      ministry: existing.ministry,
      address: `${existing.ministry === 'Church-wide' ? '' : 'ministries/'}${existing.slug}`,
      status: existing.status,
      isNew: false,
    }
  } else {
    if (mode === 'ministry' || !q.template) notFound()
    const template = templateFor(q.template)
    const title = (q.title ?? 'New page').slice(0, 60)
    const ministry = MINISTRY_OPTIONS.includes(q.ministry ?? '') ? (q.ministry as string) : MINISTRY_OPTIONS[0]
    props = {
      template,
      initial: starterValues(template, title),
      initialHidden: [],
      title,
      ministry,
      address: `${ministry === 'Church-wide' ? '' : 'ministries/'}${slugFor(title) || 'new-page'}`,
      status: 'Draft',
      isNew: true,
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/pages" prefetch={false} className="text-base text-clw-gold underline-offset-4 hover:underline">
        ← Pages
      </Link>
      <PageEditor {...props} mode={mode} />
    </div>
  )
}
