'use client'

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { Lock, Minus, Monitor, Plus, Smartphone } from 'lucide-react'

import { READ_ONLY_MESSAGE } from '@/lib/demo-readonly'
import type { PageTemplate, PageValues, Slot, Value } from '@/lib/demo-pages'
import { PagePreview } from '../PagePreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

type Mode = 'full' | 'editor' | 'ministry'

type Props = {
  template: PageTemplate
  initial: PageValues
  initialHidden: string[]
  title: string
  ministry: string
  address: string
  status: string
  mode: Mode
  isNew: boolean
}

const LINKS = ['Plan a Visit', 'Give', 'Ministries', 'Request form', 'Sign-up form', 'Events', 'Contact the office']

function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null
  const len = value.length
  const color = len > max ? 'text-red-400' : len >= max - 8 ? 'text-clw-gold' : 'text-clw-gray'
  return (
    <span className={`text-sm tabular-nums ${color}`}>
      {len} / {max}
    </span>
  )
}

function Field({
  slot,
  value,
  onChange,
  onBlocked,
  id,
}: {
  slot: Slot
  value: string
  onChange: (v: string) => void
  onBlocked: (what: string) => void
  id: string
}) {
  const label = (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-base font-semibold text-clw-white">
        {slot.label}
      </label>
      <Counter value={value} max={slot.max} />
    </div>
  )
  const help = slot.help ? <p className="text-sm text-clw-gray">{slot.help}</p> : null

  if (slot.type === 'image' || slot.type === 'video') {
    return (
      <div className="space-y-2">
        <p className="text-base font-semibold text-clw-white">{slot.label}</p>
        <div className="flex items-center gap-3">
          <img src={value} alt="" className="h-20 w-28 rounded-md object-cover" />
          <div className="space-y-2">
            <label className="inline-flex h-11 cursor-pointer items-center rounded-md border border-clw-gold/50 px-4 text-base font-semibold text-clw-gold hover:bg-clw-black-3">
              {slot.type === 'video' ? 'Replace video or photo' : 'Replace photo'}
              <input
                type="file"
                accept={slot.type === 'video' ? 'image/*,video/*' : 'image/*'}
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f && f.type.startsWith('image/')) onChange(URL.createObjectURL(f))
                  else if (f) onBlocked('Video uploads')
                }}
              />
            </label>
            {slot.ratio && <p className="text-sm text-clw-gray">Shape {slot.ratio}, cropped to fit. Shown here only; nothing uploads in the demo.</p>}
          </div>
        </div>
        {slot.type === 'image' ? (
          <Input aria-label="Photo description for screen readers" placeholder="Describe the photo (required)" className="text-base" defaultValue="" />
        ) : (
          <Input aria-label="YouTube link" placeholder="Or paste a YouTube link" className="text-base" defaultValue="" />
        )}
        {help}
      </div>
    )
  }
  if (slot.type === 'linked') {
    return (
      <div className="flex items-start gap-2 rounded-md border border-clw-gold/20 bg-clw-black-3 p-3 text-base text-clw-gray">
        <Lock className="mt-1 h-4 w-4 shrink-0 text-clw-gold" />
        <span>
          <span className="font-semibold text-clw-white">{slot.label}.</span> {slot.help}
        </span>
      </div>
    )
  }
  if (slot.type === 'date') {
    return (
      <div className="space-y-2">
        {label}
        <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="text-base" />
        {help}
      </div>
    )
  }
  if (slot.type === 'paragraph') {
    return (
      <div className="space-y-2">
        {label}
        <Textarea id={id} value={value} rows={3} onChange={(e) => onChange(e.target.value)} className="text-base" />
        {help}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {label}
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="text-base" />
      {slot.type === 'button' && (
        <select aria-label={`${slot.label} link`} className="h-11 w-full rounded-md border border-input bg-background px-3 text-base" defaultValue={LINKS[0]}>
          {LINKS.map((l) => (
            <option key={l}>Goes to: {l}</option>
          ))}
        </select>
      )}
      {help}
    </div>
  )
}

export function PageEditor({ template, initial, initialHidden, title, ministry, address, status, mode, isNew }: Props) {
  const [values, setValues] = useState<PageValues>(initial)
  const [hidden, setHidden] = useState<string[]>(initialHidden)
  const [phone, setPhone] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const set = (id: string, v: Value) => setValues((prev) => ({ ...prev, [id]: v }))
  const blocked = (what: string) => setNotice(`${what}: ${READ_ONLY_MESSAGE}`)
  const tooLong = template.sections.some(
    (s) =>
      !hidden.includes(s.key) &&
      s.slots.some((slot) => slot.max && typeof values[`${s.key}.${slot.key}`] === 'string' && (values[`${s.key}.${slot.key}`] as string).length > slot.max)
  )

  const actions =
    mode === 'full'
      ? [
          { label: 'Save draft', what: 'Saving a draft' },
          { label: 'Publish', what: 'Publishing', primary: true },
        ]
      : [
          { label: 'Save draft', what: 'Saving a draft' },
          { label: 'Submit for approval', what: 'Sending for approval', primary: true },
        ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-clw-gold/20 bg-clw-black-2 p-4">
        <div>
          <p className="text-xl font-semibold text-clw-white">{title}</p>
          <p className="text-base text-clw-gray">
            {template.name} · {ministry} · sbcelginil.org/{address} · <span className="text-clw-gold">{isNew ? 'New draft' : status}</span>
          </p>
          {mode !== 'full' && <p className="text-base text-clw-gray">A Church Admin reviews your changes before they appear on the website.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a.label} variant={a.primary ? 'default' : 'outline'} className="text-base" onClick={() => blocked(a.what)} disabled={a.primary && tooLong}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
      {notice && (
        <div role="status" className="rounded-md border border-clw-gold/50 bg-clw-black-3 px-4 py-3 text-base text-clw-white">
          {notice} In the real system this is where the change would {mode === 'full' ? 'save or go live' : 'save or go to the approval queue'}.
        </div>
      )}
      {tooLong && <p className="text-base text-red-400">One or more fields are over their limit. Shorten them to keep the layout intact.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          {template.sections.map((section) => {
            const off = hidden.includes(section.key)
            return (
              <section key={section.key} className="space-y-4 rounded-xl border border-clw-gold/20 bg-clw-black-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-clw-gold">{section.label}</h2>
                  {section.optional && (
                    <label className="flex items-center gap-2 text-base text-clw-gray">
                      Show this section
                      <Switch checked={!off} onCheckedChange={(on) => setHidden((h) => (on ? h.filter((k) => k !== section.key) : [...h, section.key]))} />
                    </label>
                  )}
                </div>
                {!off &&
                  section.slots.map((slot) => {
                    const id = `${section.key}.${slot.key}`
                    if (slot.type === 'list') {
                      const items = (Array.isArray(values[id]) ? values[id] : []) as Record<string, string>[]
                      const min = slot.minItems ?? 0
                      const max = slot.maxItems ?? 12
                      return (
                        <div key={id} className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <p className="text-base font-semibold text-clw-white">{slot.label}</p>
                            <span className="text-sm text-clw-gray">
                              {items.length} of {min === max ? max : `${min} to ${max}`}
                            </span>
                          </div>
                          {items.map((item, i) => (
                            <div key={i} className="space-y-3 rounded-lg border border-clw-gold/15 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-base text-clw-gray">Item {i + 1}</span>
                                <button
                                  type="button"
                                  disabled={items.length <= min}
                                  onClick={() => set(id, items.filter((_, j) => j !== i))}
                                  className="inline-flex items-center gap-1 text-base text-clw-gold disabled:opacity-40"
                                >
                                  <Minus className="h-4 w-4" /> Remove
                                </button>
                              </div>
                              {(slot.item ?? []).map((f) => (
                                <Field
                                  key={f.key}
                                  id={`${id}.${i}.${f.key}`}
                                  slot={f}
                                  value={item[f.key] ?? ''}
                                  onBlocked={blocked}
                                  onChange={(v) => set(id, items.map((it, j) => (j === i ? { ...it, [f.key]: v } : it)))}
                                />
                              ))}
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={items.length >= max}
                            onClick={() =>
                              set(id, [...items, Object.fromEntries((slot.item ?? []).map((f) => [f.key, f.type === 'image' ? template.thumb : f.label]))])
                            }
                            className="inline-flex h-11 items-center gap-1 rounded-md border border-clw-gold/40 px-4 text-base font-semibold text-clw-gold disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" /> Add {slot.label.toLowerCase().replace(/s$/, '')}
                          </button>
                        </div>
                      )
                    }
                    return <Field key={id} id={id} slot={slot} value={typeof values[id] === 'string' ? (values[id] as string) : ''} onBlocked={blocked} onChange={(v) => set(id, v)} />
                  })}
                {off && <p className="text-base text-clw-gray">Hidden on this page.</p>}
              </section>
            )
          })}
        </div>

        <div className="space-y-3 xl:sticky xl:top-16 xl:self-start">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-clw-white">Live preview</p>
            <div className="flex gap-1 rounded-md border border-clw-gold/30 p-1">
              <button type="button" onClick={() => setPhone(false)} aria-pressed={!phone} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-base ${!phone ? 'bg-clw-gold text-clw-black' : 'text-clw-gray'}`}>
                <Monitor className="h-4 w-4" /> Desktop
              </button>
              <button type="button" onClick={() => setPhone(true)} aria-pressed={phone} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-base ${phone ? 'bg-clw-gold text-clw-black' : 'text-clw-gray'}`}>
                <Smartphone className="h-4 w-4" /> Phone
              </button>
            </div>
          </div>
          <div className="max-h-[80vh] overflow-y-auto rounded-2xl">
            <PagePreview template={template} values={values} hidden={hidden} phone={phone} />
          </div>
          <p className="text-sm text-clw-gray">Fonts, layout and backgrounds come from the template and can&apos;t be changed here.</p>
        </div>
      </div>
    </div>
  )
}
