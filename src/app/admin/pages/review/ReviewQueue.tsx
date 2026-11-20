'use client'

import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'

import { READ_ONLY_MESSAGE } from '@/lib/demo-readonly'
import { templateFor, type SamplePage } from '@/lib/demo-pages'
import { PagePreview } from '../PagePreview'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/** Slot labels whose values differ between the live and proposed versions. */
function changes(page: SamplePage): string[] {
  if (!page.live) return []
  const t = templateFor(page.template)
  const out: string[] = []
  for (const s of t.sections)
    for (const slot of s.slots) {
      const id = `${s.key}.${slot.key}`
      if (JSON.stringify(page.live[id]) !== JSON.stringify(page.values[id])) out.push(`${s.label}: ${slot.label}`)
    }
  return out
}

export function ReviewQueue({ items }: { items: SamplePage[] }) {
  const [active, setActive] = useState(items[0]?.slug)
  const [phone, setPhone] = useState(false)
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const page = items.find((p) => p.slug === active)
  if (!page) return <p className="text-base text-clw-gray">Nothing is waiting for approval.</p>
  const template = templateFor(page.template)
  const changed = changes(page)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => {
              setActive(p.slug)
              setNotice(null)
            }}
            aria-pressed={p.slug === active}
            className={`rounded-lg border px-4 py-3 text-left text-base ${p.slug === active ? 'border-clw-gold bg-clw-black-3 text-clw-white' : 'border-clw-gold/20 text-clw-gray hover:border-clw-gold/60'}`}
          >
            <span className="block font-semibold">{p.title}</span>
            <span className="block text-sm">{p.live ? 'Changes to a live page' : 'New page'} · {p.edited}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-clw-gold/20 bg-clw-black-2 p-4">
        <p className="text-base text-clw-white">
          <span className="font-semibold">From:</span> {page.submittedBy}
        </p>
        <p className="text-base text-clw-gray">&ldquo;{page.note}&rdquo;</p>
        {changed.length > 0 && (
          <div>
            <p className="text-base font-semibold text-clw-white">What changed</p>
            <ul className="list-disc pl-6 text-base text-clw-gray">
              {changed.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note back to the sender (optional)" className="text-base" />
        <div className="flex flex-wrap gap-2">
          <Button className="text-base" onClick={() => setNotice(`Approving and publishing: ${READ_ONLY_MESSAGE}`)}>
            Approve and publish
          </Button>
          <Button variant="outline" className="text-base" onClick={() => setNotice(`Sending back: ${READ_ONLY_MESSAGE}`)}>
            Send back with note
          </Button>
        </div>
        {notice && (
          <p role="status" className="rounded-md border border-clw-gold/50 bg-clw-black-3 px-4 py-3 text-base text-clw-white">
            {notice}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <div className="flex gap-1 rounded-md border border-clw-gold/30 p-1">
          <button type="button" onClick={() => setPhone(false)} aria-pressed={!phone} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-base ${!phone ? 'bg-clw-gold text-clw-black' : 'text-clw-gray'}`}>
            <Monitor className="h-4 w-4" /> Desktop
          </button>
          <button type="button" onClick={() => setPhone(true)} aria-pressed={phone} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-base ${phone ? 'bg-clw-gold text-clw-black' : 'text-clw-gray'}`}>
            <Smartphone className="h-4 w-4" /> Phone
          </button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xl font-semibold text-clw-white">Live now</p>
          {page.live ? (
            <div className="max-h-[75vh] overflow-y-auto rounded-2xl">
              <PagePreview template={template} values={page.live} hidden={page.hidden ?? []} phone={phone} />
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-clw-gold/30 p-6 text-center text-base text-clw-gray">
              This is a new page. Nothing is on the website yet.
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold text-clw-gold">Proposed</p>
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl">
            <PagePreview template={template} values={page.values} hidden={page.hidden ?? []} phone={phone} />
          </div>
        </div>
      </div>
    </div>
  )
}
