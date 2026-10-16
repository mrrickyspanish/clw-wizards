'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, FileCheck2, RotateCcw, Upload } from 'lucide-react'

import {
  getAdminDocumentDownloadUrl,
  getAdminDocumentUrl,
  prepareAdminBirthCertificateUpload,
  recordAdminBirthCertificate,
  setDocumentVerified,
} from './actions'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { downloadDocument, openDocument } from '@/lib/open-document'
import { Button } from '@/components/ui/button'

/**
 * A wrestler's birth certificate for admins: view, download, verify, and
 * upload or replace it for a family that sent it to the club. Used on
 * Registrations and on a family's page in Families.
 */
export function BirthCertificateDocument({
  athleteId,
  document,
}: {
  athleteId: string
  document: { id: string; verified: boolean } | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function view() {
    if (!document) return
    setError(null)
    void openDocument(() => getAdminDocumentUrl(document.id)).then((message) => {
      if (message) setError(message)
    })
  }

  function download() {
    if (!document) return
    setError(null)
    void downloadDocument(() => getAdminDocumentDownloadUrl(document.id)).then((message) => {
      if (message) setError(message)
    })
  }

  function toggleVerified() {
    if (!document) return
    setError(null)
    startTransition(async () => {
      const result = await setDocumentVerified({ documentId: document.id, verified: !document.verified })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    setError(null)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }

    setUploading(true)
    try {
      const ticket = await prepareAdminBirthCertificateUpload({ athleteId, fileName: file.name, fileSize: file.size })
      if (!ticket.ok) {
        setError(ticket.error)
        return
      }
      const { error: uploadError } = await createBrowserSupabase()
        .storage.from('athlete-documents')
        .uploadToSignedUrl(ticket.path, ticket.token, file)
      if (uploadError) {
        setError(uploadError.message)
        return
      }
      const result = await recordAdminBirthCertificate({ athleteId, path: ticket.path, fileName: file.name })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    } catch {
      setError('Could not upload the file. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {document && (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={view}>
              <Eye className="mr-1.5 h-4 w-4" /> View birth certificate
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={download}>
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={pending || uploading} onClick={toggleVerified}>
              {document.verified ? (
                <>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Undo verification
                </>
              ) : (
                <>
                  <FileCheck2 className="mr-1.5 h-4 w-4" /> Verify
                </>
              )}
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {uploading ? 'Uploading…' : document ? 'Replace' : 'Upload birth certificate'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {error && <p className="text-base text-red-400">{error}</p>}
    </div>
  )
}
