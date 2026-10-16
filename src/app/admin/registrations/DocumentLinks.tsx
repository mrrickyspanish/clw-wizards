'use client'

import { useState } from 'react'
import { Download, Eye } from 'lucide-react'

import { getAdminDocumentDownloadUrl, getAdminDocumentUrl } from './actions'
import { downloadDocument, openDocument } from '@/lib/open-document'
import { Button } from '@/components/ui/button'

/** View and Download for one uploaded document, for admins. No review actions. */
export function DocumentLinks({ documentId }: { documentId: string }) {
  const [error, setError] = useState<string | null>(null)

  function view() {
    setError(null)
    void openDocument(() => getAdminDocumentUrl(documentId)).then((message) => {
      if (message) setError(message)
    })
  }

  function download() {
    setError(null)
    void downloadDocument(() => getAdminDocumentDownloadUrl(documentId)).then((message) => {
      if (message) setError(message)
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" className="max-sm:flex-1 max-sm:px-2 max-sm:[&_svg]:hidden" onClick={view}>
          <Eye className="mr-1.5 h-4 w-4" /> View
        </Button>
        <Button type="button" variant="ghost" size="sm" className="max-sm:flex-1 max-sm:px-2 max-sm:[&_svg]:hidden" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" /> Download
        </Button>
      </div>
      {error && <p className="text-base text-red-400">{error}</p>}
    </div>
  )
}
