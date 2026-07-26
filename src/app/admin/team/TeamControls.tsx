'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plus, X } from 'lucide-react'

import type { AdminInvite, AdminScope } from '@/types/database'
import { createAdminInvite, revokeAdminInvite } from './actions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const SCOPE_LABEL: Record<AdminScope, string> = { full: 'Full access', limited: 'Limited access' }

export function TeamControls({ invites }: { invites: AdminInvite[] }) {
  const router = useRouter()
  const [scope, setScope] = useState<AdminScope>('limited')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    const result = await createAdminInvite(scope)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
    } catch {
      setError('Could not copy — select the code and copy it manually.')
    }
  }

  async function handleRevoke(id: string) {
    const result = await revokeAdminInvite(id)
    if (result.ok) router.refresh()
  }

  return (
    <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
      <h2 className="mb-3 text-sm font-medium text-clw-white">Invite an admin</h2>
      <p className="mb-4 text-sm text-clw-gray">
        Generate a one-time code and share it with the person you&apos;re adding. They enter it at{' '}
        <span className="font-mono text-clw-gold-ink">/admin-signup</span> to create their account. Codes expire in 14
        days and work once.
      </p>

      {/* Access level picker — this sets the tier the code grants. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['limited', 'full'] as AdminScope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              scope === s
                ? 'border-clw-gold/50 bg-clw-gold/15 text-clw-gold-ink'
                : 'border-clw-gold/15 text-clw-gray hover:text-clw-white'
            }`}
          >
            {SCOPE_LABEL[s]}
          </button>
        ))}
        <Button size="sm" onClick={handleGenerate} disabled={loading} className="ml-auto">
          <Plus className="mr-1.5 h-4 w-4" />
          {loading ? 'Creating…' : 'New invite code'}
        </Button>
      </div>

      <p className="mb-4 text-xs text-clw-gray/70">
        {scope === 'full'
          ? 'Full access can also edit the public website (copy, photos, FAQ).'
          : 'Limited access covers everything except editing the public website.'}
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {invites.length === 0 ? (
        <p className="text-sm text-clw-gray">No active invites.</p>
      ) : (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-3 rounded-xl bg-clw-black px-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="font-mono text-lg tracking-[0.18em] text-clw-white">{inv.code}</span>
                <Badge variant="outline" className="border-clw-gold/40 bg-clw-gold/10 text-clw-gold-ink">
                  {SCOPE_LABEL[inv.scope]}
                </Badge>
              </span>
              <span className="flex items-center gap-1">
                {copied === inv.code ? (
                  <Button
                    size="sm"
                    className="pointer-events-none bg-clw-gold text-clw-black hover:bg-clw-gold"
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Copied!
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(inv.code)}
                    className="text-clw-gray hover:text-clw-gold"
                  >
                    <Copy className="mr-1.5 h-4 w-4" /> Copy
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(inv.id)}
                  aria-label="Revoke invite"
                  className="text-clw-gray hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
