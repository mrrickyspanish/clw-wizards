'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Eye } from 'lucide-react'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { recordDocument, getDocumentUrl } from './actions'
import { Button } from '@/components/ui/button'

type DocType = 'birth_certificate' | 'usa_wrestling_card' | 'other'

// Strip anything that would confuse a storage path; keep it recognizable.
function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
}

export function DocumentControls({
  userId,
  athleteId,
  docType,
  existingPath,
}: {
  userId: string
  athleteId: string
  docType: DocType
  existingPath: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    setBusy(true)

    // Path MUST start with the user's id (storage RLS).
    const path = `${userId}/${athleteId}/${docType}-${Date.now()}-${safeName(file.name)}`
    const supabase = createBrowserSupabase()
    const { error: upErr } = await supabase.storage.from('athlete-documents').upload(path, file, { upsert: false })
    if (upErr) {
      setBusy(false)
      setError(upErr.message)
      return
    }
    const result = await recordDocument({ athleteId, docType, fileUrl: path, fileName: file.name })
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleView() {
    if (!existingPath) return
    setError(null)
    const result = await getDocumentUrl(existingPath)
    if (!result.ok) {
      setError(result.error)
      return
    }
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {existingPath && (
          <Button type="button" variant="ghost" size="sm" onClick={handleView}>
            <Eye className="mr-1.5 h-4 w-4" /> View
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1.5 h-4 w-4" />
          {busy ? 'Uploading…' : existingPath ? 'Replace' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
