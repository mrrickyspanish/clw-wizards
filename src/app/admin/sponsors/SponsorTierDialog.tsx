'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

import type { SponsorTierRow } from '@/types/database'
import { updateSponsorTier } from './actions'
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

export function SponsorTierDialog({ tier }: { tier: SponsorTierRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [label, setLabel] = useState(tier.label)
  const [price, setPrice] = useState(tier.price_cents == null ? '' : String(tier.price_cents / 100))
  const [sortOrder, setSortOrder] = useState(String(tier.sort_order))
  const [publicCheckout, setPublicCheckout] = useState(tier.public_checkout)
  const [active, setActive] = useState(tier.active)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedPrice = price.trim()
    let priceCents: number | null = null
    if (trimmedPrice !== '') {
      const dollars = Number(trimmedPrice)
      if (!Number.isFinite(dollars) || dollars < 0) {
        setError('Enter a valid price, or leave it blank for a custom "contact us" tier.')
        return
      }
      priceCents = Math.round(dollars * 100)
    }

    setLoading(true)
    const result = await updateSponsorTier(tier.slug, {
      label,
      price_cents: priceCents,
      sort_order: Number(sortOrder),
      public_checkout: publicCheckout,
      active,
    })
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
          <DialogTitle className="text-clw-gold">Edit sponsorship tier</DialogTitle>
          <DialogDescription>
            Changes the label, price, and ordering shown on the public sponsorship page and used at checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tier-label">Label</Label>
            <Input id="tier-label" required value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier-price">Price (USD)</Label>
              <Input
                id="tier-price"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Custom"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-sm text-clw-gray">Blank = a custom “contact us” tier (not sold online).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier-sort">Sort order</Label>
              <Input
                id="tier-sort"
                type="number"
                min="0"
                step="1"
                required
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={publicCheckout} onCheckedChange={(checked) => setPublicCheckout(checked === true)} />
            Show on public sponsorship page &amp; checkout
          </label>

          <label className="flex items-center gap-2 text-sm text-clw-white">
            <Checkbox checked={active} onCheckedChange={(checked) => setActive(checked === true)} />
            Active
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
