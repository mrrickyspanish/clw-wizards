'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#groups', label: 'Practice Groups' },
  { href: '#tournaments', label: 'Tournaments' },
  { href: '#donate', label: 'Support' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-clw-gold/10 bg-clw-black/80 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl tracking-wide text-clw-gold">
          {ORG.shortName}
          <span className="ml-2 hidden align-middle text-xs font-body uppercase tracking-[0.2em] text-clw-gray sm:inline">
            Wrestling Club
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-clw-white/80 transition-colors hover:text-clw-gold">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-clw-white/80 transition-colors hover:text-clw-gold">
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Join the Wizards</Link>
          </Button>
        </div>

        <button
          type="button"
          className="text-clw-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-clw-gold/10 bg-clw-black/95 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-clw-white/80 hover:text-clw-gold"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link href="/signup">Join</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
