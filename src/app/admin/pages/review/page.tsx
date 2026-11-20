import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SAMPLE_PAGES } from '@/lib/demo-pages'
import { pagesAccess } from '../access'
import { ReviewQueue } from './ReviewQueue'

export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
  const { mode } = await pagesAccess()
  // Only Church Admins approve page changes.
  if (mode !== 'full') notFound()
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" prefetch={false} className="text-base text-clw-gold underline-offset-4 hover:underline">
          ← Pages
        </Link>
        <h1 className="mt-2 font-display text-3xl text-clw-gold">Approval queue</h1>
        <p className="mt-1 max-w-2xl text-base text-clw-gray">
          Page changes from Page Editors and Ministry Admins wait here. Nothing reaches the website until a Church Admin approves it.
        </p>
      </div>
      <ReviewQueue items={SAMPLE_PAGES.filter((p) => p.status === 'In review')} />
    </div>
  )
}
