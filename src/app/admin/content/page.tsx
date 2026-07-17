import { CONTENT_FIELDS } from '@/lib/content/registry'
import { getSiteContent } from '@/lib/content/get'
import { createAdminSupabase } from '@/lib/supabase/admin'
import type { FaqItem } from '@/types/database'
import { ContentEditor } from './ContentEditor'
import { FaqManager } from './FaqManager'

export default async function AdminContentPage() {
  const content = await getSiteContent()
  const initial: Record<string, string> = {}
  for (const field of CONTENT_FIELDS) initial[field.key] = content.get(field.key)

  const admin = createAdminSupabase()
  const { data: faqData } = await admin
    .from('faq_items')
    .select('*')
    .order('sort_order', { ascending: true })
  const faqItems = (faqData ?? []) as FaqItem[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Website content</h1>
        <p className="text-sm text-clw-gray">
          Edit the headlines, copy, photos, and stats on the public site. Layout and styling stay fixed—only the
          content changes. Blank a field and reset to restore the original.
        </p>
      </div>

      <ContentEditor initial={initial} />

      <div className="mt-8">
        <FaqManager items={faqItems} />
      </div>
    </div>
  )
}
