'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ORG } from '@/config/org.config'

const NAV_LINKS = [
  { href: '/about', label: 'Mission' },
  { href: '/#events', label: 'Events' },
  { href: '/program', label: 'Groups' },
  { href: '/sponsorship', label: 'Support' },
]

const MOBILE_NAV_LINKS = [...NAV_LINKS, { href: '/join', label: 'Join the Wizards' }]
const DESKTOP_LEFT_LINKS = NAV_LINKS.slice(0, 3)
const DESKTOP_RIGHT_LINKS = [NAV_LINKS[3]]
const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'

const SEARCH_ITEMS = [
  {
    title: 'Mission',
    description: 'Learn what Wizards Wrestling stands for and how the club serves area wrestlers.',
    href: '/about',
    keywords: ['about', 'mission', 'club', 'history', 'values'],
  },
  {
    title: 'Training Groups',
    description: 'Explore Black, Gold, and White practice groups and find the right level.',
    href: '/program',
    keywords: ['groups', 'practice', 'training', 'black', 'gold', 'white', 'program'],
  },
  {
    title: 'Upcoming Events',
    description: 'See upcoming tournaments, fundraisers, and club events.',
    href: '/#events',
    keywords: ['events', 'calendar', 'tournaments', 'schedule'],
  },
  {
    title: 'Support the Club',
    description: 'Donate, sponsor, join the boosters, or volunteer.',
    href: '/sponsorship',
    keywords: ['support', 'donate', 'sponsor', 'boosters', 'volunteer'],
  },
  {
    title: 'Meet the Team',
    description: 'Meet the coaches and staff behind Wizards Wrestling.',
    href: '/coaches',
    keywords: ['coaches', 'staff', 'team', 'leadership'],
  },
  {
    title: 'Visit the Facility',
    description: 'Find the gym at 975 Nimco Drive, Unit L, Crystal Lake, Illinois.',
    href: '/#location',
    keywords: ['location', 'facility', 'gym', 'address', 'directions', 'nimco'],
  },
  {
    title: 'Parent / Staff Login',
    description: 'Sign in to the club portal.',
    href: '/login',
    keywords: ['login', 'portal', 'parent', 'staff', 'account'],
  },
  {
    title: 'New Families',
    description: 'Learn what to expect, explore training groups, and choose the right next step for your wrestler.',
    href: '/join',
    keywords: ['join', 'signup', 'register', 'registration', 'new family', 'first practice', 'visit'],
  },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  useEffect(() => {
    if (!searchOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [searchOpen])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchResults = normalizedQuery
    ? SEARCH_ITEMS.filter((item) =>
        `${item.title} ${item.description} ${item.keywords.join(' ')}`.toLowerCase().includes(normalizedQuery)
      )
    : SEARCH_ITEMS.slice(0, 5)

  function openSearch() {
    setOpen(false)
    setSearchQuery('')
    setSearchOpen(true)
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'border-b border-clw-gold/15 bg-clw-black/90 backdrop-blur-md' : 'bg-clw-black/55 backdrop-blur-sm'
        }`}
      >
        <div className="border-b border-clw-white/10 bg-clw-black/75 px-5 py-1.5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1.5 whitespace-nowrap font-cond text-[0.68rem] uppercase tracking-[0.13em] text-clw-white/75 transition-colors hover:text-clw-gold sm:text-xs"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-clw-gold" />
              <span>Crystal Lake, IL</span>
            </a>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openSearch}
                className="flex h-7 w-28 items-center justify-between border-b border-clw-white/25 px-1 text-xs text-clw-white/55 transition-colors hover:border-clw-gold hover:text-clw-white sm:w-36 lg:w-44"
                aria-label="Open site search"
              >
                <span>Search</span>
                <Search className="h-3.5 w-3.5" />
              </button>

              {ORG.social.facebook && (
                <a
                  href={ORG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Wizards Wrestling on Facebook"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-clw-white/25 text-clw-white/80 transition-colors hover:border-clw-gold hover:text-clw-gold"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current">
                    <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H8v3h2.6v8h3.1Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[72px] px-5 py-4 sm:min-h-[74px] sm:px-8 lg:min-h-[78px] lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 lg:hidden">
            <button
              type="button"
              className="flex flex-col justify-self-start gap-1.5 text-clw-white"
              onClick={() => setOpen((value) => !value)}
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
              href="/login"
              className="flex items-center justify-self-end gap-1 whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-clw-white"
            >
              Login
              <ArrowUpRight className="h-4 w-4 text-clw-gold" />
            </Link>
          </div>

          <div className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid">
            <nav className="flex items-center justify-self-end gap-6 pr-6 xl:gap-8 xl:pr-8">
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

            <div className="grid min-w-0 grid-cols-[auto_auto_1fr] items-center gap-x-6 pl-6 xl:gap-x-8 xl:pl-8">
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
                href="/join"
                className="whitespace-nowrap text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-clw-white/85 transition-colors hover:text-clw-gold xl:text-[0.8rem]"
              >
                Join the Wizards
              </Link>
              <Button
                asChild
                size="sm"
                className="chamfer-sm h-9 justify-self-end rounded-none bg-clw-gold px-4 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-clw-black hover:bg-clw-gold-l xl:px-5 xl:text-[0.72rem]"
              >
                <Link href="/login">Parent / Staff Login</Link>
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <nav inert={!open} className="min-h-0 overflow-hidden border-t border-clw-gold/10 bg-clw-black/95">
            {MOBILE_NAV_LINKS.map((link, index) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-clw-white/10 px-6 py-5 font-display text-4xl uppercase tracking-wide text-clw-white transition-all duration-300 ease-out hover:text-clw-gold ${
                  open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
                style={{ transitionDelay: open ? `${120 + index * 70}ms` : '0ms' }}
              >
                {link.label}
              </Link>
            ))}
            <div
              className={`px-6 py-5 transition-all duration-300 ease-out ${
                open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
              }`}
              style={{ transitionDelay: open ? `${120 + MOBILE_NAV_LINKS.length * 70}ms` : '0ms' }}
            >
              <Button asChild size="lg" className="w-full text-base">
                <Link href="/login">Parent / Staff Login</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-clw-black/85 px-4 pt-20 backdrop-blur-md sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Search Wizards Wrestling"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false)
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden border border-clw-gold/30 bg-clw-black-2 shadow-2xl shadow-black/60">
            <div className="flex items-center gap-3 border-b border-clw-white/10 px-4 sm:px-6">
              <Search className="h-5 w-5 shrink-0 text-clw-gold" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="What are you looking for?"
                autoFocus
                className="h-16 min-w-0 flex-1 bg-transparent text-lg text-clw-white outline-none placeholder:text-clw-white/40 sm:h-20 sm:text-xl"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="flex h-10 w-10 items-center justify-center text-clw-white/70 transition-colors hover:text-clw-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-4">
              <p className="px-3 pb-3 font-cond text-xs uppercase tracking-[0.24em] text-clw-gold">
                {normalizedQuery ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}` : 'Popular destinations'}
              </p>

              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="group flex items-center justify-between gap-5 border border-transparent px-3 py-4 transition hover:border-clw-gold/30 hover:bg-clw-white/[0.04] sm:px-4"
                    >
                      <span>
                        <span className="block font-display text-2xl uppercase leading-none tracking-wide text-clw-white group-hover:text-clw-gold">
                          {item.title}
                        </span>
                        <span className="mt-2 block text-sm leading-relaxed text-clw-gray sm:text-base">
                          {item.description}
                        </span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-clw-gold" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-clw-white/20 px-5 py-10 text-center">
                  <p className="font-display text-2xl uppercase text-clw-white">No matching pages</p>
                  <p className="mt-3 text-sm text-clw-gray">Try new families, events, groups, facility, coaches, support, or login.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
