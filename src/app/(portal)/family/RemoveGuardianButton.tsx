'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

import { removeFamilyGuardian } from './actions'
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

export function RemoveGuardianButton({ id, label, action }: { id: string; label: string; action: 'remove' | 'leave' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    const result = await removeFamilyGuardian(id)
    setLoading(false)
    if (result.ok) router.refresh()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-clw-gray hover:text-red-400"
          aria-label={action === 'leave' ? 'Leave family' : 'Remove guardian'}
        >
          {action === 'leave' ? 'Leave' : <X className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action === 'leave' ? 'Leave this family?' : 'Remove this guardian?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'leave'
              ? `You'll lose access to ${label} and their wrestlers.`
              : `${label} will lose access to your family's wrestlers.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={loading}>
            {loading ? 'Removing…' : action === 'leave' ? 'Leave' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
