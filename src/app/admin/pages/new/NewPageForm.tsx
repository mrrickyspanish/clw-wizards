'use client'

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

import { MINISTRY_OPTIONS, PAGE_TEMPLATES, slugFor, type TemplateKey } from '@/lib/demo-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewPageForm() {
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateKey>('story')
  const [title, setTitle] = useState('')
  const [ministry, setMinistry] = useState(MINISTRY_OPTIONS[0])
  const slug = slugFor(title)
  const prefix = ministry === 'Church-wide' ? '' : 'ministries/'

  function start() {
    const q = new URLSearchParams({ template, title: title.trim() || 'New page', ministry })
    router.push(`/admin/pages/edit?${q.toString()}`)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-clw-white">1. Choose a template</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PAGE_TEMPLATES.map((t) => {
            const on = t.key === template
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                aria-pressed={on}
                className={`relative overflow-hidden rounded-xl border bg-clw-black-2 text-left transition-colors ${on ? 'border-clw-gold ring-2 ring-clw-gold/40' : 'border-clw-gold/20 hover:border-clw-gold/60'}`}
              >
                <img src={t.thumb} alt="" className="aspect-[16/9] w-full object-cover" />
                <span className="block space-y-1 p-4">
                  <span className="block text-xl font-semibold text-clw-white">{t.name}</span>
                  <span className="block text-base text-clw-gray">{t.job}</span>
                  <span className="block text-base text-clw-gray">
                    <span className="font-semibold text-clw-gold">Best for:</span> {t.bestFor}
                  </span>
                </span>
                {on && (
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-clw-gold text-clw-black">
                    <Check className="h-5 w-5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="text-2xl font-semibold text-clw-white">2. Name it</h2>
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base">
            Page title
          </Label>
          <Input id="title" value={title} maxLength={60} placeholder="e.g. Health Care Ministry" onChange={(e) => setTitle(e.target.value)} className="text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ministry" className="text-base">
            Belongs to
          </Label>
          <select
            id="ministry"
            value={ministry}
            onChange={(e) => setMinistry(e.target.value)}
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
          >
            {MINISTRY_OPTIONS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <p className="text-base text-clw-gray">
          Web address: <span className="font-semibold text-clw-white">sbcelginil.org/{prefix}{slug || 'page-name'}</span>
        </p>
        <Button onClick={start} className="text-base">
          Start with sample content
        </Button>
        <p className="text-base text-clw-gray">The page opens filled with sample text and photos so you can see where everything goes. It stays a draft until a Church Admin publishes it.</p>
      </section>
    </div>
  )
}
