'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

import type { Athlete } from '@/types/database'
import { ORG } from '@/config/org.config'
import { updateAthlete, type AthleteInput } from './actions'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AthleteDialog({ athlete }: { athlete: Athlete }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(athlete.first_name)
  const [lastName, setLastName] = useState(athlete.last_name)
  const [dob, setDob] = useState(athlete.date_of_birth)
  const [group, setGroup] = useState(athlete.practice_group)
  const [weightClass, setWeightClass] = useState(athlete.weight_class ?? '')
  const [cardNumber, setCardNumber] = useState(athlete.usa_wrestling_card_number ?? '')
  const [shirtSize, setShirtSize] = useState(athlete.shirt_size ?? '')
  const [active, setActive] = useState(athlete.active)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const values: AthleteInput = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      practice_group: group,
      weight_class: weightClass,
      usa_wrestling_card_number: cardNumber,
      shirt_size: shirtSize,
      active,
    }

    const result = await updateAthlete(athlete.id, values)
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
        <Button variant="ghost" size="sm" className="text-clw-gray hover:text-clw-gold">
          <Pencil className="mr-1.5 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">Edit athlete</DialogTitle>
          <DialogDescription>
            {athlete.first_name} {athlete.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight_class">Weight class</Label>
              <Input id="weight_class" value={weightClass} onChange={(e) => setWeightClass(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shirt_size">Shirt size</Label>
              <Input id="shirt_size" value={shirtSize} onChange={(e) => setShirtSize(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_number">USA Wrestling card #</Label>
            <Input id="card_number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
            Active roster member
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
