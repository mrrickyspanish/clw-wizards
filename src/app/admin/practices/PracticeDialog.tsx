'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'

import type { Practice } from '@/types/database'
import { ORG } from '@/config/org.config'
import { WEEKDAYS } from '@/lib/practice'
import { createPractice, updatePractice, type PracticeInput } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PracticeDialog({ practice }: { practice?: Practice }) {
  const router = useRouter()
  const editing = Boolean(practice)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [group, setGroup] = useState(practice?.practice_group ?? ORG.practiceGroups[0])
  const [weekday, setWeekday] = useState(String(practice?.weekday ?? 2))
  const [startTime, setStartTime] = useState(practice?.start_time ?? '18:30')
  const [endTime, setEndTime] = useState(practice?.end_time ?? '')
  const [location, setLocation] = useState(practice?.location ?? '')
  const [notes, setNotes] = useState(practice?.notes ?? '')
  const [active, setActive] = useState(practice?.active ?? true)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const values: PracticeInput = {
      practice_group: group,
      weekday: Number(weekday),
      start_time: startTime,
      end_time: endTime,
      location,
      notes,
      active,
    }
    const result = editing ? await updatePractice(practice!.id, values) : await createPractice(values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Add practice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{editing ? 'Edit practice' : 'Add practice'}</DialogTitle>
          <DialogDescription>Recurring weekly practice for a group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Practice group</Label>
            <Select value={group} onValueChange={setGroup}>
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

          <div className="space-y-2">
            <Label>Day of week</Label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d, i) => (
                  <SelectItem key={d} value={String(i)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start time</Label>
              <Input id="start_time" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End time</Label>
              <Input id="end_time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
            Active
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Save changes' : 'Add practice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
