import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Mobile-only sticky conversion bar: keeps the primary action thumb-reachable
// as a prospective family scrolls the landing. Same label as the header/hero
// ("Join the Wizards"), one intent. Hidden on desktop.
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-clw-gold/10 bg-clw-black/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-3">
        <Button asChild className="flex-1">
          <Link href="/signup">Join the Wizards</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
