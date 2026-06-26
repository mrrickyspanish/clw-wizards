'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { createBrowserSupabase } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  )
}
