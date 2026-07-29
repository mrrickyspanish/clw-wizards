'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Eye, FileCheck2, RotateCcw } from 'lucide-react'

import { getAdminDocumentUrl, reviewSeasonEnrollment, setDocumentVerified } from './actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ReviewControls({
  enrollmentId,
  documentId,
  documentVerified,
  status,
  approvalReady,
}: {
  enrollmentId: string
  documentId: string | null
  documentVerified: boolean
  status: string
  approvalReady: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const approved = status === 'approved'

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.')
        return
      }
      onSuccess?.()
      router.refresh()
    })
  }

  function viewDocument() {
    if (!documentId) return
    setError(null)
    startTransition(async () => {
      const result = await getAdminDocumentUrl(documentId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.open(result.url, '_blank', 'noopener,noreferrer')
    })
  }

  function requestChanges() {
    run(
      () => reviewSeasonEnrollment({ enrollmentId, status: 'changes_requested', note }),
      () => {
        setDialogOpen(false)
        setNote('')
      }
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {documentId && (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={viewDocument}>
            <Eye className="mr-1.5 h-4 w-4" /> View card
          </Button>
        )}

        {documentId && !approved && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => setDocumentVerified({ documentId, verified: !documentVerified }))}
          >
            {documentVerified ? (
              <>
                <RotateCcw className="mr-1.5 h-4 w-4" /> Undo verification
              </>
            ) : (
              <>
                <FileCheck2 className="mr-1.5 h-4 w-4" /> Verify card
              </>
            )}
          </Button>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={pending || approved}>
              Request update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-clw-gold">Request an update</DialogTitle>
              <DialogDescription>
                Tell the parent exactly what needs to be corrected. The note appears in their portal and is emailed to them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`review-note-${enrollmentId}`}>Club note</Label>
              <Textarea
                id={`review-note-${enrollmentId}`}
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Please upload a current, readable USA Wrestling card."
              />
            </div>
            <DialogFooter>
              <Button type="button" disabled={pending || !note.trim()} onClick={requestChanges}>
                {pending ? 'Sending…' : 'Send request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          type="button"
          size="sm"
          disabled={pending || !approvalReady || approved}
          onClick={() => run(() => reviewSeasonEnrollment({ enrollmentId, status: 'approved', note: null }))}
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          {approved ? 'Approved' : 'Approve'}
        </Button>
      </div>
      {error && <p className="text-right text-xs text-red-400">{error}</p>}
    </div>
  )
}
