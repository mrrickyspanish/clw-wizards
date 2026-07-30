'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown, MapPin, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import ScrollingTicker from '@/components/landing/ScrollingTicker'
import { ORG } from '@/config/org.config'

const NAV_LINKS = [
  { href: '/about', label: 'Mission' },
  { href: '/events', label: 'Events' },
  { href: '/program', label: 'Groups' },
  { href: '/partners', label: 'Partners' },
  { href: '/sponsorship', label: 'Support' },
]

const MOBILE_NAV_LINKS = [...NAV_LINKS, { href: '/join', label: 'Join the Wizards' }]

type DesktopMenu = {
  href: string
  label: string
  description: string
  links: Array<{ href: string; label: string; description: string }>
}

const DESKTOP_LEFT_MENUS: DesktopMenu[] = [
  {
    href: '/about',
    label: 'Mission',
    description: 'The people, purpose, and place behind Wizards Wrestling.',
    links: [
      { href: '/about', label: 'Our Mission', description: 'Learn what the club stands for.' },
      { href: '/coaches', label: 'Coaches', description: 'Meet the leaders in the room.' },
      { href: '/#location', label: 'Facility', description: 'Find the Wizards training home.' },
      { href: '/faq', label: 'Questions', description: 'Get answers before getting started.' },
    ],
  },
  {
    href: '/events',
    label: 'Events',
    description: 'Club dates, community events, and the road ahead.',
    links: [
      { href: '/events', label: 'Club Calendar', description: 'See tournaments and upcoming events.' },
      { href: '/golf-outing', label: 'Golf Outing', description: 'Support the annual club fundraiser.' },
      { href: '/registration', label: 'Season Registration', description: 'Register a wrestler for the active season.' },
    ],
  },
  {
    href: '/program',
    label: 'Groups',
    description: 'A development path for every level of wrestler.',
    links: [
      { href: '/program', label: 'Training Groups', description: 'Explore the full Wizards program.' },
      { href: '/coaches', label: 'Meet the Coaches', description: 'See who leads each level.' },
      { href: '/join', label: 'Visit a Practice', description: 'Learn how to watch or shadow a session.' },
    ],
  },
]

const DESKTOP_RIGHT_MENUS: DesktopMenu[] = [
  {
    href: '/partners',
    label: 'Partners',
    description: 'Meet the businesses and families backing the room.',
    links: [
      { href: '/partners', label: 'Partner Wall', description: 'See the current Wizards partners.' },
      { href: '/sponsorship#sponsors', label: 'Sponsorship Packages', description: 'Review business support levels.' },
      { href: '/sponsorship#contact', label: 'Become a Partner', description: 'Start a conversation with the club.' },
    ],
  },
  {
    href: '/sponsorship',
    label: 'Support',
    description: 'Direct ways to invest in Wizards wrestlers.',
    links: [
      { href: '/sponsorship#donate', label: 'Donate', description: 'Make a one-time contribution.' },
      { href: '/sponsorship#boosters', label: 'Booster Club', description: 'Become a recurring supporter.' },
      { href: '/sponsorship#sponsors', label: 'Sponsor the Club', description: 'Put your business behind the team.' },
    ],
  },
  {
    href: '/join',
    label: 'Join',
    description: 'Take the next step when your family is ready.',
    links: [
      { href: '/join', label: 'How to Join', description: 'Understand the process from first visit to registration.' },
      { href: '/program', label: 'Explore Groups', description: 'Find the right training level.' },
      { href: '/registration', label: 'Register for the Season', description: 'Start or continue annual registration.' },
    ],
  },
]

const ALL_DESKTOP_MENUS = [...DESKTOP_LEFT_MENUS, ...DESKTOP_RIGHT_MENUS]

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
    description: 'Meet the businesses and community partners who back Wizards Wrestling.',
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
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<string | null>(null)
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
      if (event.key !== 'Escape') return
      setSearchOpen(false)
      setActiveDesktopMenu(null)
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

  const selectedDesktopMenu = ALL_DESKTOP_MENUS.find((menu) => menu.label === activeDesktopMenu) ?? null

  function openSearch() {
    setOpen(false)
    setActiveDesktopMenu(null)
    setSearchQuery('')
    setSearchOpen(true)
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function closeDesktopMenuWhenFocusLeaves(event: React.FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) setActiveDesktopMenu(null)
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px" />
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? 'border-b border-clw-gold/15 bg-clw-black/90 backdrop-blur-md' : 'bg-clw-black/55 backdrop-blur-sm'
        }`}
      >
        <div className="border-b border-clw-white/10 bg-clw-black/85 px-5 py-1.5 sm:px-8 xl:px-12 xl:py-0 2xl:px-16">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 xl:min-h-[44px]">
            <Link
              href="/#location"
              className="flex min-w-0 items-center gap-1.5 whitespace-nowrap font-cond text-[0.68rem] uppercase tracking-[0.13em] text-clw-white/75 transition-colors hover:text-clw-gold sm:text-xs xl:gap-2.5 xl:text-[0.8rem] xl:tracking-[0.16em]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-clw-gold xl:h-4 xl:w-4" />
              <span className="font-semibold text-clw-white/90">Wizards Facility</span>
              <span className="hidden text-clw-white/55 sm:inline">975 Nimco Dr, Unit L, Crystal Lake, IL</span>
            </Link>

            <div className="flex items-center gap-3 xl:gap-2.5">
              <button
                type="button"
                onClick={openSearch}
                className="flex h-7 w-28 items-center justify-between border-b border-clw-white/25 px-1 text-xs text-clw-white/55 transition-colors hover:border-clw-gold hover:text-clw-white sm:w-36 xl:h-9 xl:w-52 xl:border xl:border-clw-white/15 xl:bg-clw-white/[0.03] xl:px-3 xl:font-cond xl:text-[0.76rem] xl:uppercase xl:tracking-[0.13em]"
                aria-label="Open site search"
              >
                <span>Search</span>
                <Search className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
              </button>

              {ORG.social.facebook && (
                <a
                  href={ORG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Wizards Wrestling on Facebook"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-clw-white/25 text-clw-white/80 transition-colors hover:border-clw-gold hover:text-clw-gold xl:h-9 xl:w-9"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current xl:h-4 xl:w-4">
                    <path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.2-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H8v3h2.6v8h3.1Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div
          className="relative bg-clw-black px-5 py-3 sm:px-8 sm:py-3.5 xl:px-0 xl:py-0"
          onMouseLeave={() => setActiveDesktopMenu(null)}
          onBlurCapture={closeDesktopMenuWhenFocusLeaves}
        >
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 xl:hidden">
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

          <div className="mx-auto hidden h-[92px] max-w-[1600px] grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)_220px] items-stretch xl:grid">
            <nav className="flex items-stretch justify-end gap-8 pr-9 2xl:gap-11 2xl:pr-12" aria-label="Primary navigation left">
              {DESKTOP_LEFT_MENUS.map((menu) => {
                const active = isActive(menu.href)
                const expanded = activeDesktopMenu === menu.label
                return (
                  <Link
                    key={menu.label}
                    href={menu.href}
                    aria-current={active ? 'page' : undefined}
                    aria-haspopup="true"
                    aria-expanded={expanded}
                    onMouseEnter={() => setActiveDesktopMenu(menu.label)}
                    onFocus={() => setActiveDesktopMenu(menu.label)}
                    className={`group relative flex items-center gap-1.5 whitespace-nowrap font-cond text-[0.9rem] font-bold uppercase tracking-[0.13em] transition-colors 2xl:text-[0.96rem] 2xl:tracking-[0.15em] ${
                      active || expanded ? 'text-clw-gold' : 'text-clw-white/90 hover:text-clw-white'
                    }`}
                  >
                    {menu.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-0 h-[3px] origin-center bg-clw-gold transition-transform duration-200 ${
                        active || expanded ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                )
              })}
            </nav>

            <Link
              href="/"
              aria-label="Wizards Wrestling home"
              className="group relative flex items-center justify-center border-x border-clw-white/10 bg-clw-black-2"
              onFocus={() => setActiveDesktopMenu(null)}
            >
              <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-clw-gold text-clw-gold transition-transform duration-200 group-hover:scale-105">
                <span className="absolute -top-[9px] bg-clw-black-2 px-1.5 text-[0.7rem] leading-none">★</span>
                <span className="pr-1 font-display text-[3.2rem] font-black leading-none tracking-[-0.13em]">W</span>
              </span>
            </Link>

            <nav className="flex items-stretch justify-start gap-8 pl-9 2xl:gap-11 2xl:pl-12" aria-label="Primary navigation right">
              {DESKTOP_RIGHT_MENUS.map((menu) => {
                const active = isActive(menu.href)
                const expanded = activeDesktopMenu === menu.label
                return (
                  <Link
                    key={menu.label}
                    href={menu.href}
                    aria-current={active ? 'page' : undefined}
                    aria-haspopup="true"
                    aria-expanded={expanded}
                    onMouseEnter={() => setActiveDesktopMenu(menu.label)}
                    onFocus={() => setActiveDesktopMenu(menu.label)}
                    className={`group relative flex items-center gap-1.5 whitespace-nowrap font-cond text-[0.9rem] font-bold uppercase tracking-[0.13em] transition-colors 2xl:text-[0.96rem] 2xl:tracking-[0.15em] ${
                      active || expanded ? 'text-clw-gold' : 'text-clw-white/90 hover:text-clw-white'
                    }`}
                  >
                    {menu.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-0 h-[3px] origin-center bg-clw-gold transition-transform duration-200 ${
                        active || expanded ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                )
              })}
            </nav>

            <Link
              href="/login"
              onFocus={() => setActiveDesktopMenu(null)}
              className="chamfer-sm flex h-full items-center justify-center gap-2 bg-clw-gold px-5 font-cond text-[0.88rem] font-bold uppercase tracking-[0.12em] text-clw-black transition-colors hover:bg-clw-gold-l 2xl:text-[0.94rem]"
            >
              Parent / Staff Login
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {selectedDesktopMenu && (
            <div className="absolute inset-x-0 top-full z-30 hidden border-y border-clw-gold/25 bg-clw-black-2 shadow-[0_24px_50px_-24px_rgba(0,0,0,.95)] xl:block">
              <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(15rem,.75fr)_minmax(0,1.6fr)_auto] items-start gap-10 px-12 py-7 2xl:px-16">
                <div>
                  <p className="font-cond text-xs font-bold uppercase tracking-[0.24em] text-clw-gold">Explore {selectedDesktopMenu.label}</p>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-clw-gray">{selectedDesktopMenu.description}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedDesktopMenu.links.map((link) => (
                    <Link
                      key={`${selectedDesktopMenu.label}-${link.label}`}
                      href={link.href}
                      className="group border-l-2 border-clw-white/10 px-4 py-2.5 transition-colors hover:border-clw-gold hover:bg-clw-white/[0.03]"
                    >
                      <span className="block font-cond text-sm font-bold uppercase tracking-[0.12em] text-clw-white transition-colors group-hover:text-clw-gold">
                        {link.label}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-clw-gray/75">{link.description}</span>
                    </Link>
                  ))}
                </div>

                <Link
                  href={selectedDesktopMenu.href}
                  className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-5 font-cond text-sm font-bold uppercase tracking-[0.11em] text-clw-black transition-colors hover:bg-clw-gold-l"
                >
                  View {selectedDesktopMenu.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out xl:hidden ${
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

        <ScrollingTicker ariaLabel="Wizards Wrestling sponsorship levels" />
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
