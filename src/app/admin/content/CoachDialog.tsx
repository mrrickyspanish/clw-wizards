'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'

import type { Coach, CoachSection } from '@/types/database'
import { ORG } from '@/config/org.config'
import { createCoach, updateCoach, deleteCoach, type CoachInput } from './coach-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CoachDialog({ coach, nextSort }: { coach?: Coach; nextSort?: number }) {
  const router = useRouter()
  const isEdit = Boolean(coach)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(coach?.name ?? '')
  const [role, setRole] = useState(coach?.role ?? '')
  const [section, setSection] = useState<CoachSection>(coach?.section ?? 'practice')
  const [practiceGroup, setPracticeGroup] = useState(coach?.practice_group ?? ORG.practiceGroups[0])
  const [sortOrder, setSortOrder] = useState(String(coach?.sort_order ?? nextSort ?? 0))
  const [active, setActive] = useState(coach?.active ?? true)

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setName(coach?.name ?? '')
      setRole(coach?.role ?? '')
      setSection(coach?.section ?? 'practice')
      setPracticeGroup(coach?.practice_group ?? ORG.practiceGroups[0])
      setSortOrder(String(coach?.sort_order ?? nextSort ?? 0))
      setActive(coach?.active ?? true)
    }
    setOpen(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const values: CoachInput = {
      name,
      role,
      section,
      practice_group: practiceGroup,
      sort_order: Number(sortOrder),
      active,
    }
    const result = isEdit ? await updateCoach(coach!.id, values) : await createCoach(values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!coach) return
    if (!window.confirm('Remove this person from the roster? This cannot be undone.')) return
    setError(null)
    setDeleting(true)
    const result = await deleteCoach(coach.id)
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
            <Plus className="mr-2 h-4 w-4" /> Add person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{isEdit ? 'Edit person' : 'Add person'}</DialogTitle>
          <DialogDescription>Shown on the public Coaches &amp; Staff page.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="coach-name">Name</Label>
            <Input id="coach-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={section} onValueChange={(v) => setSection(v as CoachSection)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="board">Board &amp; main contacts</SelectItem>
                <SelectItem value="practice">Practice-room coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {section === 'board' ? (
            <div className="space-y-2">
              <Label htmlFor="coach-role">Role / title</Label>
              <Input
                id="coach-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Vice President of Operations"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Practice group</Label>
              <Select value={practiceGroup} onValueChange={setPracticeGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG.practiceGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="coach-sort">Sort order</Label>
              <Input
                id="coach-sort"
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
                {deleting ? 'Removing…' : 'Remove'}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
