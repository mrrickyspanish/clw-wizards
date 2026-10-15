'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, UserMinus } from 'lucide-react'

import { deleteWrestlerPermanently, getWrestlerDeletionPreview, type WrestlerDeletionPreview } from './actions'
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
 * Permanently removes one wrestler, for a child who will not be wrestling.
 * The rest of the family stays. Same safeguards as deleting a family: the
 * preview is on screen first, and the button stays disabled until the
 * wrestler's name is typed. Rendered only for full admins.
 */
export function DeleteWrestlerButton({ athleteId }: { athleteId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<WrestlerDeletionPreview | null>(null)
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
    const result = await getWrestlerDeletionPreview(athleteId)
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
    const result = await deleteWrestlerPermanently(athleteId, typed)
    if (!result.ok) {
      setDeleting(false)
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  const nameMatches = Boolean(preview) && typed.trim().toLowerCase() === preview?.athleteName.trim().toLowerCase()

  const lines = preview
    ? [
        { label: 'Season registrations', value: preview.registrations },
        { label: 'Unpaid dues', value: preview.unpaidDues },
        { label: 'Uploaded documents', value: preview.documents },
        { label: 'Tournament entries', value: preview.tournamentEntries },
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
        <UserMinus className="mr-2 h-4 w-4" /> Remove wrestler
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Remove this wrestler permanently
            </DialogTitle>
            <DialogDescription className="text-base">
              This cannot be undone. The wrestler and everything below are erased. The rest of the family stays.
            </DialogDescription>
          </DialogHeader>

          {loading && <p className="text-base text-clw-gray">Checking what this would remove…</p>}

          {preview && (
            <div className="space-y-4">
              <div className="rounded-md border border-clw-gold/15 bg-clw-black-2 p-4">
                <p className="text-base font-semibold text-clw-white">{preview.athleteName}</p>
                <p className="mt-1 text-sm text-clw-gray">Family: {preview.parentName}</p>
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
                <p className="text-base text-clw-gray">This wrestler has no registrations, dues or documents.</p>
              )}

              {preview.paidDues > 0 && (
                <p className="text-base leading-relaxed text-clw-gray">
                  {preview.paidDues} paid dues record{preview.paidDues === 1 ? '' : 's'} stay
                  {preview.paidDues === 1 ? 's' : ''} on the family&apos;s account as payment history.
                </p>
              )}

              {preview.onlyWrestler && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="text-base leading-relaxed text-amber-200">
                    This is the family&apos;s only wrestler. The parent account stays, with no wrestlers on it. To remove
                    the whole family, use Delete permanently at the top of the page.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor={`confirm-wrestler-${athleteId}`} className="block text-base text-clw-gray">
                  Type <span className="font-semibold text-clw-white">{preview.athleteName}</span> to confirm.
                </label>
                <Input
                  id={`confirm-wrestler-${athleteId}`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={preview.athleteName}
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
              {deleting ? 'Removing…' : 'Remove permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
