'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Upload } from 'lucide-react'

import type { Sponsor, SponsorTier, SponsorTierRow } from '@/types/database'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { createSponsor, updateSponsor, deleteSponsor, type SponsorInput } from './actions'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Full tier domain (the sponsor_tier enum), with readable fallback labels so the
// picker works even before the sponsor_tiers table is seeded. When that table is
// present, its (editable) labels take over.
const TIER_FALLBACK: { slug: SponsorTier; label: string }[] = [
  { slug: 'white', label: 'White' },
  { slug: 'black', label: 'Black' },
  { slug: 'yellow', label: 'Gold' },
  { slug: 'platinum', label: 'Platinum' },
  { slug: 'wizard_for_life', label: 'Wizard for Life' },
]

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
}

export function SponsorDialog({ sponsor, tiers }: { sponsor?: Sponsor; tiers: SponsorTierRow[] }) {
  const router = useRouter()
  const isEdit = Boolean(sponsor)

  const tierOptions = TIER_FALLBACK.map((f) => ({
    slug: f.slug,
    label: tiers.find((t) => t.slug === f.slug)?.label ?? f.label,
  }))

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(sponsor?.name ?? '')
  const [tier, setTier] = useState<SponsorTier>(sponsor?.tier ?? 'white')
  const [logoUrl, setLogoUrl] = useState(sponsor?.logo_url ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(sponsor?.website_url ?? '')
  const [contactName, setContactName] = useState(sponsor?.contact_name ?? '')
  const [contactEmail, setContactEmail] = useState(sponsor?.contact_email ?? '')
  const [amount, setAmount] = useState(sponsor?.amount_cents == null ? '' : String(sponsor.amount_cents / 100))
  const [recurring, setRecurring] = useState(sponsor?.recurring ?? false)
  const [active, setActive] = useState(sponsor?.active ?? true)
  const [golfHole, setGolfHole] = useState(sponsor?.golf_outing_hole ?? false)
  const [notes, setNotes] = useState(sponsor?.notes ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setName(sponsor?.name ?? '')
      setTier(sponsor?.tier ?? 'white')
      setLogoUrl(sponsor?.logo_url ?? '')
      setWebsiteUrl(sponsor?.website_url ?? '')
      setContactName(sponsor?.contact_name ?? '')
      setContactEmail(sponsor?.contact_email ?? '')
      setAmount(sponsor?.amount_cents == null ? '' : String(sponsor.amount_cents / 100))
      setRecurring(sponsor?.recurring ?? false)
      setActive(sponsor?.active ?? true)
      setGolfHole(sponsor?.golf_outing_hole ?? false)
      setNotes(sponsor?.notes ?? '')
    }
    setOpen(next)
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5MB.')
      return
    }
    setUploading(true)
    const supabase = createBrowserSupabase()
    const path = `logos/${Date.now()}-${safeName(file.name)}`
    const { error: upErr } = await supabase.storage.from('sponsor-logos').upload(path, file, { upsert: false })
    if (upErr) {
      setUploading(false)
      setError(upErr.message)
      return
    }
    const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function buildValues(): SponsorInput {
    const trimmedAmount = amount.trim()
    let amountCents: number | null = null
    if (trimmedAmount !== '') {
      const dollars = Number(trimmedAmount)
      if (Number.isFinite(dollars) && dollars >= 0) amountCents = Math.round(dollars * 100)
    }
    return {
      name,
      tier,
      logo_url: logoUrl,
      website_url: websiteUrl,
      contact_name: contactName,
      contact_email: contactEmail,
      amount_cents: amountCents,
      recurring,
      active,
      golf_outing_hole: golfHole,
      notes,
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const values = buildValues()
    const result = isEdit ? await updateSponsor(sponsor!.id, values) : await createSponsor(values)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!sponsor) return
    if (!window.confirm(`Delete ${sponsor.name}? This cannot be undone.`)) return
    setError(null)
    setDeleting(true)
    const result = await deleteSponsor(sponsor.id)
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
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit {sponsor!.name}</span>
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add sponsor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-clw-gold">{isEdit ? 'Edit sponsor' : 'Add sponsor'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this sponsor’s details and visibility.' : 'Add a business to the sponsor marquee.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="sponsor-name">Business name</Label>
            <Input id="sponsor-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SponsorTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsor-amount">Committed amount (USD)</Label>
              <Input
                id="sponsor-amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Optional"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsor-logo">Logo</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload file'}
              </Button>
              {logoUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin logo preview thumbnail */}
                  <img src={logoUrl} alt="Logo preview" className="h-10 w-10 rounded object-contain" />
                  <button
                    type="button"
                    className="text-xs text-clw-gray underline hover:text-clw-gold"
                    onClick={() => setLogoUrl('')}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <Input
              id="sponsor-logo"
              type="url"
              placeholder="…or paste a logo URL (https://…)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-clw-gray">Shown in the sponsor marquee. Without a logo, the name is shown instead.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsor-website">Website</Label>
            <Input
              id="sponsor-website"
              type="url"
              placeholder="https://…"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sponsor-contact-name">Contact name</Label>
              <Input id="sponsor-contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsor-contact-email">Contact email</Label>
              <Input
                id="sponsor-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-clw-white">
              <Checkbox checked={active} onCheckedChange={(c) => setActive(c === true)} />
              Active (shown publicly)
            </label>
            <label className="flex items-center gap-2 text-sm text-clw-white">
              <Checkbox checked={recurring} onCheckedChange={(c) => setRecurring(c === true)} />
              Recurring
            </label>
            <label className="flex items-center gap-2 text-sm text-clw-white">
              <Checkbox checked={golfHole} onCheckedChange={(c) => setGolfHole(c === true)} />
              Golf-outing hole
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsor-notes">Notes</Label>
            <Textarea id="sponsor-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit ? (
              <Button type="button" variant="ghost" className="text-red-400 hover:text-red-300" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add sponsor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
