'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Download, Eye, XCircle } from 'lucide-react'

import { rejectUpload, verifyUpload } from './actions'
import { getAdminDocumentDownloadUrl, getAdminDocumentUrl } from '../registrations/actions'
import { downloadDocument, openDocument } from '@/lib/open-document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// What the family is told. They are emailed the reason with a link to upload
// a new one, so each reads as a request, not a code.
const REASONS = {
  usa_wrestling_card: [
    'Hard to read. Please upload a clearer photo of the card.',
    'This card is expired. Please upload the current season card.',
    'This is not a USA Wrestling card.',
  ],
  birth_certificate: [
    'Hard to read. Please upload a clearer photo.',
    'This is not a birth certificate.',
    'The name or birth date does not match the wrestler.',
  ],
} as const

/**
 * The controls for one upload on To review: open it, type the card number
 * (cards), and Verify or Reject. Verifying saves the number in the same tap.
 */
export function ReviewItem({
  documentId,
  docType,
  wrestlerName,
  cardNumber,
}: {
  documentId: string
  docType: 'usa_wrestling_card' | 'birth_certificate'
  wrestlerName: string
  cardNumber: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [number, setNumber] = useState(cardNumber ?? '')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)
  const [other, setOther] = useState('')
  const isCard = docType === 'usa_wrestling_card'

  function view() {
    setError(null)
    void openDocument(() => getAdminDocumentUrl(documentId)).then((message) => message && setError(message))
  }

  function download() {
    setError(null)
    void downloadDocument(() => getAdminDocumentDownloadUrl(documentId)).then((message) => message && setError(message))
  }

  function verify() {
    setError(null)
    startTransition(async () => {
      const result = await verifyUpload({ documentId, cardNumber: isCard ? number : undefined })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  const reason = choice === 'other' ? other.trim() : choice

  function reject() {
    if (!reason) return
    setError(null)
    startTransition(async () => {
      const result = await rejectUpload({ documentId, reason })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setRejectOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" className="max-sm:flex-1" onClick={view}>
          <Eye className="mr-1.5 h-4 w-4" /> View
        </Button>
        <Button type="button" variant="ghost" size="sm" className="max-sm:flex-1" onClick={download}>
          <Download className="mr-1.5 h-4 w-4" /> Download
        </Button>
      </div>

      {isCard && (
        <div className="space-y-1.5 sm:max-w-xs">
          <Label htmlFor={`card-${documentId}`} className="text-base">
            Card #
          </Label>
          <Input
            id={`card-${documentId}`}
            inputMode="numeric"
            autoComplete="off"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="From the card"
            className="text-base"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button type="button" size="sm" disabled={pending} onClick={verify}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> {pending ? 'Saving…' : 'Verify'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setChoice(null)
            setOther('')
            setRejectOpen(true)
          }}
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <XCircle className="mr-1.5 h-4 w-4" /> Reject
        </Button>
      </div>

      {error && <p className="text-base text-red-400">{error}</p>}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-clw-gold">Reject this upload?</DialogTitle>
            <DialogDescription className="text-base">
              {wrestlerName} goes back on the missing list, and the family is emailed this reason with a link to upload a
              new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2" role="radiogroup" aria-label="Reason">
            {[...REASONS[docType], 'other'].map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={choice === option}
                onClick={() => setChoice(option)}
                className={`flex min-h-11 w-full items-center rounded-lg border px-4 py-2 text-left text-base transition-colors ${
                  choice === option
                    ? 'border-clw-gold/60 bg-clw-gold/10 text-clw-white'
                    : 'border-clw-gold/15 text-clw-gray hover:text-clw-white'
                }`}
              >
                {option === 'other' ? 'Something else (type it below)' : option}
              </button>
            ))}
            {choice === 'other' && (
              <Textarea
                rows={3}
                maxLength={300}
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="What the family should fix"
                className="text-base"
                aria-label="Reason for the family"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={reject}
              disabled={!reason || pending}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {pending ? 'Rejecting…' : 'Reject and email family'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
