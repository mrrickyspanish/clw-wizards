'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/about', label: 'Mission' },
  { href: '/#events', label: 'Events' },
  { href: '/program', label: 'Groups' },
  { href: '/sponsorship', label: 'Support' },
]

const DESKTOP_LEFT_LINKS = NAV_LINKS.slice(0, 3)
const DESKTOP_RIGHT_LINKS = [NAV_LINKS[3]]

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
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
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

            <Link
              href="/"
              className="justify-self-center whitespace-nowrap font-cond text-[1.25rem] font-semibold uppercase leading-none tracking-[0.02em] text-clw-gold sm:text-2xl"
            >
              Wizards Wrestling
            </Link>

            <Link
              href="/signup"
              className="flex items-center justify-self-end gap-1 whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-clw-white"
            >
              Join Now
              <ArrowUpRight className="h-4 w-4 text-clw-gold" />
            </Link>
          </div>

          <div className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid">
            <nav className="flex items-center justify-self-end gap-3 pr-5 xl:gap-5 xl:pr-7">
              {DESKTOP_LEFT_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-clw-white/85 transition-colors hover:text-clw-gold xl:text-[0.8rem]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/"
              className="justify-self-center whitespace-nowrap font-cond text-2xl font-semibold uppercase tracking-[0.04em] text-clw-gold xl:text-[1.65rem]"
            >
              Wizards Wrestling
            </Link>

            <nav className="flex items-center justify-self-start gap-3 pl-5 xl:gap-5 xl:pl-7">
              {DESKTOP_RIGHT_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-clw-white/85 transition-colors hover:text-clw-gold xl:text-[0.8rem]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-clw-white/85 transition-colors hover:text-clw-gold xl:text-[0.8rem]"
              >
                Parent / Staff Login
              </Link>
              <Button asChild size="sm" className="chamfer-sm h-9 rounded-none bg-clw-gold px-4 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-clw-black hover:bg-clw-gold-l xl:px-5 xl:text-xs">
                <Link href="/signup">Join the Wizards</Link>
              </Button>
            </nav>
          </div>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <nav inert={!open} className="min-h-0 overflow-hidden border-t border-clw-gold/10 bg-clw-black/95">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-clw-white/10 px-6 py-5 font-display text-4xl uppercase tracking-wide text-clw-white transition-all duration-300 ease-out hover:text-clw-gold ${
                  open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${120 + i * 70}ms` : '0ms' }}
              >
                {link.label}
              </Link>
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
