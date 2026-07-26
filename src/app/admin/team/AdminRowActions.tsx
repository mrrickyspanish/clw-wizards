'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { AdminScope } from '@/types/database'
import { setAdminActive, setAdminScope } from './actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function AdminRowActions({
  id,
  name,
  scope,
  isActive,
  isSelf,
}: {
  id: string
  name: string
  scope: AdminScope
  isActive: boolean
  isSelf: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A full admin can't act on their own row — that's how we prevent someone
  // locking themselves out or demoting the last full admin by accident.
  if (isSelf) {
    return <span className="text-xs text-clw-gray/60">You</span>
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    setLoading(true)
    const result = await fn()
    setLoading(false)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    router.refresh()
  }

  const nextScope: AdminScope = scope === 'full' ? 'limited' : 'full'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => run(() => setAdminScope(id, nextScope))}
          className="text-clw-gray hover:text-clw-gold-ink"
        >
          {scope === 'full' ? 'Make limited' : 'Make full'}
        </Button>

        {isActive ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading} className="text-clw-gray hover:text-red-400">
                Remove access
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {name}&apos;s admin access?</AlertDialogTitle>
                <AlertDialogDescription>
                  They&apos;ll be signed out of the admin dashboard and can&apos;t get back in. Nothing is deleted — you
                  can restore their access here anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => run(() => setAdminActive(id, false))} disabled={loading}>
                  {loading ? 'Removing…' : 'Remove access'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => run(() => setAdminActive(id, true))}
          >
            {loading ? 'Restoring…' : 'Restore access'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
