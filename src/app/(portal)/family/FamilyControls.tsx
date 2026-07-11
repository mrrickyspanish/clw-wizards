'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plus, X } from 'lucide-react'

import type { FamilyInvite } from '@/types/database'
import { createFamilyInvite, revokeFamilyInvite } from './actions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function FamilyControls({ invites }: { invites: FamilyInvite[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    const result = await createFamilyInvite()
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
    const result = await revokeFamilyInvite(id)
    if (result.ok) router.refresh()
  }

  return (
    <section className="card-depth rounded-2xl border border-clw-gold/10 bg-clw-black-3 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-clw-white">Invite a guardian</h2>
        <Button size="sm" onClick={handleGenerate} disabled={loading}>
          <Plus className="mr-1.5 h-4 w-4" />
          {loading ? 'Creating…' : 'New invite code'}
        </Button>
      </div>

      <p className="mb-4 text-sm text-clw-gray">
        Generate a code and share it with the guardian you want to add. They enter it when creating their account — no
        one can join by searching for your wrestler. Codes expire in 14 days and work once.
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
              <span className="font-mono text-lg tracking-[0.18em] text-clw-white">{inv.code}</span>
              <span className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(inv.code)} className="text-clw-gray hover:text-clw-gold">
                  {copied === inv.code ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
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
