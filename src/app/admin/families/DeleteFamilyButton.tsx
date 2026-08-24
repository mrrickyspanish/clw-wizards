'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2 } from 'lucide-react'

import { deleteFamilyPermanently, getFamilyDeletionPreview, type FamilyDeletionPreview } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Permanent family deletion, for clearing test accounts.
 *
 * The dialog loads a preview first so the list of what disappears is on screen
 * before the confirmation is typed, and the destructive button stays disabled
 * until the typed name matches. Rendered only for full admins.
 */
export function DeleteFamilyButton({ parentId }: { parentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<FamilyDeletionPreview | null>(null)
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setPreview(null)
      setTyped('')
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const result = await getFamilyDeletionPreview(parentId)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPreview(result.preview)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const result = await deleteFamilyPermanently(parentId, typed)
    if (!result.ok) {
      setDeleting(false)
      setError(result.error)
      return
    }
    setOpen(false)
    router.push('/admin/families')
    router.refresh()
  }

  const nameMatches = Boolean(preview) && typed.trim() === preview?.parentName.trim()

  const lines = preview
    ? [
        { label: 'Wrestlers', value: preview.athletes },
        { label: 'Season registrations', value: preview.enrollments },
        { label: 'Dues records', value: preview.duesRecords },
        { label: 'Signed agreements', value: preview.signedAgreements },
        { label: 'Uploaded documents', value: preview.documents },
        { label: 'Linked co-guardians', value: preview.coGuardianLinks },
      ].filter((line) => line.value > 0)
    : []

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Delete this family permanently
            </DialogTitle>
            <DialogDescription className="text-base">
              This cannot be undone. The login, the parent profile, and everything below are erased.
            </DialogDescription>
          </DialogHeader>

          {loading && <p className="text-base text-clw-gray">Checking what this would remove…</p>}

          {preview && (
            <div className="space-y-4">
              <div className="rounded-md border border-clw-gold/15 bg-clw-black-2 p-4">
                <p className="text-base font-semibold text-clw-white">{preview.parentName}</p>
                {preview.email && <p className="mt-1 text-sm text-clw-gray">{preview.email}</p>}
              </div>

              {lines.length > 0 ? (
                <ul className="space-y-1.5">
                  {lines.map((line) => (
                    <li key={line.label} className="flex justify-between text-base text-clw-gray">
                      <span>{line.label}</span>
                      <span className="font-semibold text-clw-white">{line.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-clw-gray">
                  This account has no wrestlers, registrations, or records attached to it.
                </p>
              )}

              {preview.duesWithPayments > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="text-base leading-relaxed text-amber-200">
                    {preview.duesWithPayments} dues record{preview.duesWithPayments === 1 ? '' : 's'} here
                    {preview.duesWithPayments === 1 ? ' has' : ' have'} a recorded payment. Deleting removes that
                    payment history from the club&apos;s records. Stripe keeps its own copy.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="confirm-family-name" className="block text-base text-clw-gray">
                  Type <span className="font-semibold text-clw-white">{preview.parentName}</span> to confirm.
                </label>
                <Input
                  id="confirm-family-name"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={preview.parentName}
                  autoComplete="off"
                  className="text-base"
                />
              </div>
            </div>
          )}

          {error && <p className="text-base text-red-400">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!nameMatches || deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
