'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarClock,
  HandCoins,
  Handshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Trophy,
  Users,
} from 'lucide-react'

import { ORG } from '@/config/org.config'
import { cn } from '@/lib/utils'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from './ThemeToggle'

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/families', label: 'Families', icon: Users },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/admin/practices', label: 'Practices', icon: CalendarClock },
  { href: '/admin/dues', label: 'Dues', icon: HandCoins },
  { href: '/admin/sponsors', label: 'Sponsors', icon: Handshake },
  { href: '/admin/communications', label: 'Communications', icon: Megaphone },
]

export function AdminMobileNav({ userName, role }: { userName: string | null; role: string | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b border-clw-gold/10 bg-clw-black/95 px-4 pb-3 backdrop-blur-md md:hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open admin navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-clw-gold/20 text-clw-white transition-colors hover:border-clw-gold/50 hover:text-clw-gold"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col border-clw-gold/15 bg-clw-black p-0 text-clw-white">
          <SheetHeader className="border-b border-clw-gold/10 px-5 pb-5 pt-6 text-left">
            <SheetTitle className="font-display text-2xl tracking-wide text-clw-gold">{ORG.shortName} Admin</SheetTitle>
            <SheetDescription className="text-clw-gray">Manage club families, events, payments, and communications.</SheetDescription>
          </SheetHeader>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {ADMIN_ITEMS.map((item) => {
              const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors',
                      active
                        ? 'bg-clw-gold/15 text-clw-gold'
                        : 'text-clw-white/75 hover:bg-clw-gold/5 hover:text-clw-white'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>

          <div className="border-t border-clw-gold/10 p-4">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-clw-black-2 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-clw-white">{userName ?? 'Admin user'}</p>
                <p className="text-xs capitalize text-clw-gray">{role ?? 'admin'}</p>
              </div>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-clw-gold/20 px-4 py-3 text-sm font-medium text-clw-white transition-colors hover:border-clw-gold/50 hover:text-clw-gold"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/admin" className="font-display text-2xl tracking-wide text-clw-gold">
        {ORG.shortName}
        <span className="ml-2 font-body text-xs uppercase tracking-[0.2em] text-clw-gray">Admin</span>
      </Link>

      <div className="h-10 w-10" aria-hidden />
    </header>
  )
}
