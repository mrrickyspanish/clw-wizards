'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'

import type { FaqItem } from '@/types/database'
import { createFaqItem, updateFaqItem, deleteFaqItem, type FaqInput } from './faq-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function FaqDialog({ item, nextSort }: { item?: FaqItem; nextSort?: number }) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [question, setQuestion] = useState(item?.question ?? '')
  const [answer, setAnswer] = useState(item?.answer ?? '')
  const [sortOrder, setSortOrder] = useState(String(item?.sort_order ?? nextSort ?? 0))
  const [active, setActive] = useState(item?.active ?? true)

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setQuestion(item?.question ?? '')
      setAnswer(item?.answer ?? '')
      setSortOrder(String(item?.sort_order ?? nextSort ?? 0))
      setActive(item?.active ?? true)
    }
    setOpen(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const values: FaqInput = { question, answer, sort_order: Number(sortOrder), active }
    const result = isEdit ? await updateFaqItem(item!.id, values) : await createFaqItem(values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!item) return
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    setError(null)
    setDeleting(true)
    const result = await deleteFaqItem(item.id)
    setDeleting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{isEdit ? 'Edit question' : 'Add question'}</DialogTitle>
          <DialogDescription>Shown in the FAQ accordion on the public site.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input id="faq-question" required value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea id="faq-answer" required rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="faq-sort">Sort order</Label>
              <Input
                id="faq-sort"
                type="number"
                min="0"
                step="1"
                required
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-clw-white">
              <Checkbox checked={active} onCheckedChange={(c) => setActive(c === true)} />
              Active (shown publicly)
            </label>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
