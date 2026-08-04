'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import ScrollingTicker from '@/components/landing/ScrollingTicker'
import { QuietBoundary } from '@/components/landing/QuietBoundary'
import { ORG } from '@/config/org.config'

const NAV_LINKS = [
  { href: '/about', label: 'Mission' },
  { href: '/events', label: 'Events' },
  { href: '/program', label: 'Groups' },
  { href: '/partners', label: 'Partners' },
  { href: '/sponsorship', label: 'Support' },
]

const MOBILE_NAV_LINKS = [...NAV_LINKS, { href: '/join', label: 'Join the Wizards' }]
const DESKTOP_LEFT_LINKS = NAV_LINKS.slice(0, 3)
const DESKTOP_RIGHT_LINKS = [...NAV_LINKS.slice(3), { href: '/join', label: 'Join' }]

const SEARCH_ITEMS = [
  {
    title: 'Mission',
    description: 'Learn what Wizards Wrestling stands for and how the club serves area wrestlers.',
    href: '/about',
    keywords: ['about', 'mission', 'club', 'history', 'values'],
  },
  {
    title: 'Training Groups',
    description: 'Explore our four practice groups, from first-timers to state-level competitors, and find the right level.',
    href: '/program',
    keywords: ['groups', 'practice', 'training', 'program', 'beginner', 'advanced', 'levels'],
  },
  {
    title: 'Upcoming Events',
    description: 'See the full calendar of tournaments, fundraisers, and club events.',
    href: '/events',
    keywords: ['events', 'calendar', 'tournaments', 'schedule'],
  },
  {
    title: 'Partners',
    description: 'Meet the sponsors and community partners who back Wizards Wrestling.',
    href: '/partners',
    keywords: ['partners', 'sponsors', 'businesses', 'community', 'platinum', 'supporters'],
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
  const pathname = usePathname()
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!searchOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function DesktopLink({ href, label }: { href: string; label: string }) {
    const active = isActive(href)

    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`group relative flex items-center whitespace-nowrap font-cond text-[1rem] font-bold uppercase tracking-[0.11em] transition-colors xl:text-[1.08rem] xl:tracking-[0.12em] 2xl:text-[1.12rem] ${
          active ? 'text-clw-gold' : 'text-clw-white/90 hover:text-clw-white'
        }`}
      >
        {label}
        <span
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-[3px] origin-center bg-clw-gold transition-transform duration-200 ${
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          }`}
        />
      </Link>
    )
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'border-b border-clw-gold/15 bg-clw-black/90 backdrop-blur-md' : 'bg-clw-black/55 backdrop-blur-sm'
        }`}
      >
        <div className="border-b border-clw-white/10 bg-clw-black/90 px-5 py-2 sm:px-8 min-[1180px]:px-10 min-[1180px]:py-0 xl:px-12 2xl:px-16">
          <div className="mx-auto flex min-h-[42px] max-w-[1600px] items-center justify-between gap-4 min-[1180px]:min-h-[46px]">
            <Link
              href="/#location"
              className="flex min-w-0 items-center gap-1.5 whitespace-nowrap font-cond text-sm uppercase tracking-[0.14em] text-clw-white/65 transition-colors hover:text-clw-gold min-[1180px]:gap-2.5 min-[1180px]:tracking-[0.15em]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-clw-gold min-[1180px]:h-4 min-[1180px]:w-4" />
              <span className="font-semibold text-clw-white/80 min-[1180px]:hidden">Crystal Lake, IL</span>
              <span className="hidden font-semibold text-clw-white/90 min-[1180px]:inline">Wizards Facility</span>
              <span className="hidden text-clw-white/55 min-[1180px]:inline">975 Nimco Dr, Unit L, Crystal Lake, IL</span>
            </Link>

            <div className="flex items-center gap-2 min-[1180px]:gap-2.5">
              <button
                type="button"
                onClick={openSearch}
                className="flex h-8 w-8 items-center justify-center text-clw-white/65 transition-colors hover:text-clw-gold min-[1180px]:w-44 min-[1180px]:justify-between min-[1180px]:border min-[1180px]:border-clw-white/15 min-[1180px]:bg-clw-white/[0.03] min-[1180px]:px-3 min-[1180px]:font-cond min-[1180px]:text-sm min-[1180px]:uppercase min-[1180px]:tracking-[0.12em] xl:w-48"
                aria-label="Open site search"
              >
                <span className="sr-only min-[1180px]:not-sr-only">Search</span>
                <Search className="h-[1.1rem] w-[1.1rem] min-[1180px]:h-4 min-[1180px]:w-4" />
              </button>

              {ORG.social.facebook && (
                <a
                  href={ORG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Wizards Wrestling on Facebook"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-clw-white/20 text-clw-white/70 transition-colors hover:border-clw-gold hover:text-clw-gold min-[1180px]:h-8 min-[1180px]:w-8"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current min-[1180px]:h-4 min-[1180px]:w-4">
                    <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H8v3h2.6v8h3.1Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-clw-gold/35 bg-clw-black px-5 min-[1180px]:border-b-0 min-[1180px]:px-0">
          <div className="grid h-[78px] grid-cols-[4.25rem_minmax(0,1fr)_4.25rem] items-center min-[1180px]:hidden sm:h-[82px]">
            <button
              type="button"
              className="flex h-12 w-12 flex-col justify-center gap-1.5 justify-self-start text-clw-white"
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {open ? (
                <X className="h-7 w-7" />
              ) : (
                <>
                  <span className="block h-0.5 w-10 bg-clw-white" />
                  <span className="block h-0.5 w-10 bg-clw-white" />
                  <span className="block h-0.5 w-10 bg-clw-white" />
                </>
              )}
            </button>

            <Link href="/" aria-label="Wizards Wrestling home" className="group justify-self-center bg-clw-black">
              <span className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full border-[5px] border-clw-gold text-clw-gold transition-transform duration-200 group-active:scale-95 sm:h-[64px] sm:w-[64px]">
                <span className="absolute -top-[10px] bg-clw-black px-1.5 text-[0.72rem] leading-none">★</span>
                <span className="pr-1 font-display text-[2.7rem] font-black leading-none tracking-[-0.13em] sm:text-[2.85rem]">W</span>
              </span>
            </Link>

            <Link
              href="/join"
              className="group flex h-12 w-full flex-col items-end justify-center justify-self-end text-clw-white transition-colors hover:text-clw-gold"
            >
              <ArrowUpRight className="h-5 w-5 text-clw-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              <span className="font-cond text-base font-bold uppercase tracking-[0.08em]">Join Now</span>
            </Link>
          </div>

          <div className="relative mx-auto hidden h-[86px] max-w-[1600px] min-[1180px]:block xl:h-[88px]">
            <nav
              className="absolute inset-y-0 right-[calc(50%+54px)] flex items-stretch gap-7 xl:right-[calc(50%+58px)] xl:gap-9 2xl:gap-11"
              aria-label="Primary navigation left"
            >
              {DESKTOP_LEFT_LINKS.map((link) => (
                <DesktopLink key={link.label} {...link} />
              ))}
            </nav>

            <Link
              href="/"
              aria-label="Wizards Wrestling home"
              className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-clw-black"
            >
              <span className="relative flex h-[66px] w-[66px] items-center justify-center rounded-full border-[5px] border-clw-gold text-clw-gold transition-transform duration-200 group-hover:scale-105 xl:h-[70px] xl:w-[70px]">
                <span className="absolute -top-[11px] bg-clw-black px-1.5 text-[0.78rem] leading-none">★</span>
                <span className="pr-1 font-display text-[2.95rem] font-black leading-none tracking-[-0.13em] xl:text-[3.15rem]">W</span>
              </span>
            </Link>

            <div className="absolute inset-y-0 left-[calc(50%+54px)] right-6 flex items-center xl:left-[calc(50%+58px)] xl:right-8 2xl:right-10">
              <nav className="flex h-full items-stretch gap-7 xl:gap-9 2xl:gap-11" aria-label="Primary navigation right">
                {DESKTOP_RIGHT_LINKS.map((link) => (
                  <DesktopLink key={link.label} {...link} />
                ))}
              </nav>

              <Link
                href="/login"
                className="chamfer-sm ml-auto flex h-[46px] items-center justify-center gap-1.5 bg-clw-gold px-4 font-cond text-[0.7rem] font-bold uppercase tracking-[0.09em] text-clw-black transition-colors hover:bg-clw-gold-l xl:h-12 xl:px-5 xl:text-[0.76rem]"
              >
                Parent / Staff Login
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out min-[1180px]:hidden ${
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

        <QuietBoundary>
          <ScrollingTicker ariaLabel="Wizards Wrestling sponsorship levels" />
        </QuietBoundary>
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
                  <p className="mt-3 text-sm text-clw-gray">Try partners, new families, events, groups, facility, coaches, support, or login.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
