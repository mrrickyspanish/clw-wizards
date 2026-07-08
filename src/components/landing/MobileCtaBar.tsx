import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Mobile-only conversion bar. Keep it pinned to the viewport bottom and avoid
// extra safe-area padding that made the bar appear to float above the content.
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-clw-gold/10 bg-clw-black/95 px-4 pb-3 pt-3 backdrop-blur-md [backface-visibility:hidden] [transform:translateZ(0)] md:hidden">
      <div className="flex items-center gap-3">
        <Button asChild className="flex-1">
          <Link href="/join">Join the Wizards</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
