'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '#groups', label: 'Practice Groups' },
  { href: '#events', label: 'Tournaments' },
  { href: '#why', label: 'Parent Portal' },
  { href: '#donate', label: 'Support' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      rootMargin: '0px',
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'border-b border-clw-gold/15 bg-clw-black/90 backdrop-blur-md' : 'bg-clw-black/55 backdrop-blur-sm'
        }`}
      >
        <div className="flex w-full items-center justify-between px-5 py-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <Link href="/" className="font-display text-3xl tracking-wide text-clw-gold">
            {ORG.shortName}
            <span className="ml-2 hidden align-middle text-sm font-body uppercase tracking-[0.2em] text-clw-gray sm:inline">
              Wrestling Club
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex xl:gap-9">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-base font-medium text-clw-white/85 transition-colors hover:text-clw-gold">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/login" className="text-base font-medium text-clw-white/85 transition-colors hover:text-clw-gold">
              Parent / Staff Login
            </Link>
            <Button asChild size="sm" className="chamfer-sm h-10 rounded-none px-5 text-sm font-semibold">
              <Link href="/signup">Join the Wizards</Link>
            </Button>
          </div>

          <button
            type="button"
            className="text-clw-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-clw-gold/10 bg-clw-black/95 px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-clw-white/85 hover:text-clw-gold"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex gap-3">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href="/signup">Join</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
