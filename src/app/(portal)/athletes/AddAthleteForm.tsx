'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { ORG } from '@/config/org.config'
import { addAthlete } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AddAthleteForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [group, setGroup] = useState(ORG.practiceGroups[0])
  const [weightClass, setWeightClass] = useState('')
  const [shirtSize, setShirtSize] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await addAthlete({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      practice_group: group,
      weight_class: weightClass,
      shirt_size: shirtSize,
      usa_wrestling_card_number: cardNumber,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/athletes')
    router.refresh()
  }

  return (
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Add wrestler'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/athletes')} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
