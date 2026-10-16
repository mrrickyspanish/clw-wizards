'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, FileCheck2, RotateCcw } from 'lucide-react'

import { getAdminDocumentUrl, setDocumentVerified } from './actions'
import { openDocument } from '@/lib/open-document'
import { Button } from '@/components/ui/button'

/**
 * View and verify a wrestler's uploaded birth certificate. Used on
 * Registrations and on a family's page in Families.
 */
export function BirthCertificateDocument({ documentId, verified }: { documentId: string; verified: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function view() {
    setError(null)
    void openDocument(() => getAdminDocumentUrl(documentId)).then((message) => {
      if (message) setError(message)
    })
  }

  function toggleVerified() {
    setError(null)
    startTransition(async () => {
      const result = await setDocumentVerified({ documentId, verified: !verified })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={view}>
          <Eye className="mr-1.5 h-4 w-4" /> View birth certificate
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggleVerified}>
          {verified ? (
            <>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Undo verification
            </>
          ) : (
            <>
              <FileCheck2 className="mr-1.5 h-4 w-4" /> Verify
            </>
          )}
        </Button>
      </div>
      {error && <p className="text-base text-red-400">{error}</p>}
    </div>
  )
}
