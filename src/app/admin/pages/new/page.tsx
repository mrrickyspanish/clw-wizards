import Link from 'next/link'
import { notFound } from 'next/navigation'

import { pagesAccess } from '../access'
import { NewPageForm } from './NewPageForm'

export const dynamic = 'force-dynamic'

export default async function NewPage() {
  const { mode } = await pagesAccess()
  // Ministry Admins edit their ministry's page but don't create new ones.
  if (mode === 'ministry') notFound()
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" prefetch={false} className="text-base text-clw-gold underline-offset-4 hover:underline">
          ← Pages
        </Link>
        <h1 className="mt-2 font-display text-3xl text-clw-gold">Insert New Page</h1>
        <p className="mt-1 max-w-2xl text-base text-clw-gray">
          Every page uses one of three church templates. The layout, fonts and photo spots are set; you fill in the words and photos.
        </p>
      </div>
      <NewPageForm />
    </div>
  )
}
