'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Upload } from 'lucide-react'

import { CONTENT_FIELDS, CONTENT_DEFAULTS, type ContentField } from '@/lib/content/registry'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { updateContent } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
}

function groupFields(): [string, ContentField[]][] {
  const groups: Record<string, ContentField[]> = {}
  for (const field of CONTENT_FIELDS) {
    ;(groups[field.group] ??= []).push(field)
  }
  return Object.entries(groups)
}

export function ContentEditor({ initial }: { initial: Record<string, string> }) {
  const router = useRouter()
  const groups = useMemo(groupFields, [])

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [baseline, setBaseline] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const dirtyKeys = CONTENT_FIELDS.filter((f) => (values[f.key] ?? '') !== (baseline[f.key] ?? '')).map((f) => f.key)
  const isDirty = dirtyKeys.length > 0

  function setValue(key: string, value: string) {
    setSaved(false)
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(field: ContentField, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setUploadingKey(field.key)
    const supabase = createBrowserSupabase()
    const path = `content/${field.key}/${Date.now()}-${safeName(file.name)}`
    const { error: upErr } = await supabase.storage.from('site-content').upload(path, file, { upsert: false })
    if (upErr) {
      setUploadingKey(null)
      setError(upErr.message)
      return
    }
    const { data } = supabase.storage.from('site-content').getPublicUrl(path)
    setValue(field.key, data.publicUrl)
    setUploadingKey(null)
    const ref = fileRefs.current[field.key]
    if (ref) ref.value = ''
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    // Only send changed fields.
    const changed: Record<string, string> = {}
    for (const key of dirtyKeys) changed[key] = values[key] ?? ''
    const result = await updateContent(changed)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBaseline(values)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {groups.map(([group, fields]) => (
        <section key={group} className="rounded-md border border-clw-gold/10 bg-clw-black p-5">
          <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-clw-gold">{group}</h2>
          <div className="space-y-5">
            {fields.map((field) => {
              const value = values[field.key] ?? ''
              const isDefault = value === CONTENT_DEFAULTS[field.key]
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={field.key} className="text-clw-white">
                      {field.label}
                    </Label>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => setValue(field.key, CONTENT_DEFAULTS[field.key])}
                        className="inline-flex items-center gap-1 text-xs text-clw-gray hover:text-clw-gold"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset to default
                      </button>
                    )}
                  </div>

                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.key}
                      rows={3}
                      value={value}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  )}

                  {field.type === 'text' && (
                    <Input id={field.key} value={value} onChange={(e) => setValue(field.key, e.target.value)} />
                  )}

                  {field.type === 'image' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {value && (
                          // eslint-disable-next-line @next/next/no-img-element -- admin content image preview
                          <img src={value} alt="" className="h-14 w-14 rounded border border-clw-gold/20 object-cover" />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingKey === field.key}
                          onClick={() => fileRefs.current[field.key]?.click()}
                        >
                          <Upload className="mr-1.5 h-4 w-4" />
                          {uploadingKey === field.key ? 'Uploading…' : 'Upload image'}
                        </Button>
                      </div>
                      <input
                        ref={(el) => {
                          fileRefs.current[field.key] = el
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(field, e)}
                      />
                      <Input
                        id={field.key}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        placeholder="Image path or URL"
                      />
                    </div>
                  )}

                  {field.help && <p className="text-sm text-clw-gray">{field.help}</p>}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex items-center justify-end gap-4 rounded-md border border-clw-gold/20 bg-clw-black-2/95 p-4 backdrop-blur">
        {saved && !isDirty && <span className="text-sm text-clw-gold">Saved.</span>}
        {isDirty && <span className="text-sm text-clw-gray">{dirtyKeys.length} unsaved change{dirtyKeys.length === 1 ? '' : 's'}</span>}
        <Button type="button" disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
