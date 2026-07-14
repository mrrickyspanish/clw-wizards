import { ExternalLink } from 'lucide-react'

import { createAdminSupabase } from '@/lib/supabase/admin'
import type { Sponsor, SponsorTier, SponsorTierRow } from '@/types/database'
import { SponsorTierDialog } from './SponsorTierDialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: 'Platinum',
  yellow: 'Yellow',
  black: 'Black',
  white: 'White',
  wizard_for_life: 'Wizard for Life',
}

function money(cents: number | null) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export default async function AdminSponsorsPage() {
  const supabase = createAdminSupabase()

  const { data: sponsors, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('amount_cents', { ascending: false, nullsFirst: false })

  const { data: tierData } = await supabase
    .from('sponsor_tiers')
    .select('*')
    .order('sort_order', { ascending: true })
  const tiers = (tierData ?? []) as SponsorTierRow[]

  const rows = (sponsors ?? []) as Sponsor[]
  const activeRows = rows.filter((s) => s.active)
  const totalCommitted = rows.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-clw-gold">Sponsors</h1>
        <p className="text-sm text-clw-gray">Club sponsors and their commitments. Sponsor-record editing is a follow-up build.</p>
      </div>

      <Card className="mb-8 border-clw-gold/10 bg-clw-black">
        <CardHeader>
          <CardTitle className="text-base text-clw-white">Sponsorship tiers</CardTitle>
          <p className="text-sm text-clw-gray">
            Labels, prices, and ordering shown on the public sponsorship page and used at checkout. Edit these to
            update the site—no code change needed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border border-clw-gold/10">
            <Table>
              <TableHeader>
                <TableRow className="border-clw-gold/10 hover:bg-transparent">
                  <TableHead className="text-clw-gray">Order</TableHead>
                  <TableHead className="text-clw-gray">Label</TableHead>
                  <TableHead className="text-clw-gray">Price</TableHead>
                  <TableHead className="text-clw-gray">Public</TableHead>
                  <TableHead className="text-clw-gray">Status</TableHead>
                  <TableHead className="text-clw-gray text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((t) => (
                  <TableRow key={t.slug} className="border-clw-gold/10">
                    <TableCell className="text-clw-gray">{t.sort_order}</TableCell>
                    <TableCell className="font-medium text-clw-white">{t.label}</TableCell>
                    <TableCell className="text-clw-white">
                      {t.price_cents == null ? <span className="text-clw-gray">Custom</span> : money(t.price_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.public_checkout
                            ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                            : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                        }
                      >
                        {t.public_checkout ? 'shown' : 'hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.active
                            ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                            : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                        }
                      >
                        {t.active ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <SponsorTierDialog tier={t} />
                    </TableCell>
                  </TableRow>
                ))}
                {tiers.length === 0 && (
                  <TableRow className="border-clw-gold/10">
                    <TableCell colSpan={6} className="text-center text-clw-gray">
                      No tiers configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Total committed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{money(totalCommitted)}</p>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Active sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{activeRows.length}</p>
          </CardContent>
        </Card>
        <Card className="border-clw-gold/10 bg-clw-black">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-clw-gray">Total on file</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-clw-white">{rows.length}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load sponsors: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black p-10 text-center">
          <p className="text-clw-gray">No sponsors yet.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-md border border-clw-gold/10 bg-clw-black">
          <Table>
            <TableHeader>
              <TableRow className="border-clw-gold/10 hover:bg-transparent">
                <TableHead className="text-clw-gray">Sponsor</TableHead>
                <TableHead className="text-clw-gray">Tier</TableHead>
                <TableHead className="text-clw-gray">Amount</TableHead>
                <TableHead className="text-clw-gray">Contact</TableHead>
                <TableHead className="text-clw-gray">Status</TableHead>
                <TableHead className="text-clw-gray">Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} className="border-clw-gold/10">
                  <TableCell>
                    <span className="font-medium text-clw-white">{s.name}</span>
                    {s.recurring && <span className="block text-xs text-clw-gray/70">recurring</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold">
                      {TIER_LABELS[s.tier]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-clw-white">{money(s.amount_cents)}</TableCell>
                  <TableCell className="text-clw-gray">
                    {s.contact_name ?? '—'}
                    {s.contact_email && <span className="block text-xs text-clw-gray/70">{s.contact_email}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.active
                          ? 'border-clw-gold/40 bg-clw-gold/10 text-clw-gold'
                          : 'border-clw-gray/40 bg-clw-gray/10 text-clw-gray'
                      }
                    >
                      {s.active ? 'active' : 'inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.website_url ? (
                      <a
                        href={s.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-clw-gray hover:text-clw-gold"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Visit {s.name}</span>
                      </a>
                    ) : (
                      <span className="text-clw-gray/50">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
