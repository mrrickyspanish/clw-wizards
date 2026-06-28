'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

import { ORG } from '@/config/org.config'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '#groups', label: 'Practice Groups' },
  { href: '#events', label: 'Tournaments' },
  { href: '#why', label: 'Parent Portal' },
  { href: '/sponsorship', label: 'Support' },
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
        <div className="px-5 py-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Mobile/tablet bar: waffle menu left, centered CLW lockup, Join Now CTA right. */}
          <div className="grid grid-cols-3 items-center lg:hidden">
            <button
              type="button"
              className="flex flex-col justify-self-start gap-1.5 text-clw-white"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? (
                <X className="h-6 w-6" />
              ) : (
                <>
                  <span className="block h-0.5 w-12 bg-clw-white" />
                  <span className="block h-0.5 w-12 bg-clw-white" />
                  <span className="block h-0.5 w-12 bg-clw-white" />
                </>
              )}
            </button>

            <Link href="/" className="justify-self-center font-display text-4xl tracking-wide text-clw-gold">
              {ORG.shortName}
            </Link>

            <Link
              href="/signup"
              className="flex items-center justify-self-end gap-1 text-sm font-semibold uppercase tracking-wide text-clw-white"
            >
              Join Now
              <ArrowUpRight className="h-4 w-4 text-clw-gold" />
            </Link>
          </div>

          {/* Desktop bar: full lockup, nav links, login + join CTA. */}
          <div className="hidden items-center justify-between lg:flex">
            <Link href="/" className="font-display text-3xl tracking-wide text-clw-gold">
              {ORG.shortName}
              <span className="ml-2 align-middle text-sm font-body uppercase tracking-[0.2em] text-clw-gray">
                Wrestling Club
              </span>
            </Link>

            <nav className="flex items-center gap-7 xl:gap-9">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="text-base font-medium text-clw-white/85 transition-colors hover:text-clw-gold">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-base font-medium text-clw-white/85 transition-colors hover:text-clw-gold">
                Parent / Staff Login
              </Link>
              <Button asChild size="sm" className="chamfer-sm h-10 rounded-none px-5 text-sm font-semibold">
                <Link href="/signup">Join the Wizards</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Always mounted so the open/close transitions actually play — grid-rows
            animates the panel height like an accordion, and each row fades/slides
            in with an increasing delay so the list cascades open one row at a time
            instead of appearing in bulk. */}
        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <nav inert={!open} className="min-h-0 overflow-hidden border-t border-clw-gold/10 bg-clw-black/95">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-clw-white/10 px-6 py-5 font-display text-4xl uppercase tracking-wide text-clw-white transition-all duration-300 ease-out hover:text-clw-gold ${
                  open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${120 + i * 70}ms` : '0ms' }}
              >
                {link.label}
              </a>
            ))}
            <div
              className={`flex gap-3 px-6 py-5 transition-all duration-300 ease-out ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
              }`}
              style={{ transitionDelay: open ? `${120 + NAV_LINKS.length * 70}ms` : '0ms' }}
            >
              <Button asChild variant="outline" size="lg" className="flex-1 text-base">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="lg" className="flex-1 text-base">
                <Link href="/signup">Join</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
