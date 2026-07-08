import Link from 'next/link'
import { Facebook, Mail, MapPin } from 'lucide-react'

import { ORG } from '@/config/org.config'

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'

const ABOUT_LINKS = [
  { href: '/about', label: 'Mission' },
  { href: '/coaches', label: 'Our Team' },
  { href: '/faq', label: 'FAQ' },
  { href: `mailto:${ORG.contactEmail}`, label: 'Contact' },
]

const QUICK_LINKS = [
  { href: '/#events', label: 'Events' },
  { href: '/program', label: 'Groups' },
  { href: '/sponsorship', label: 'Support' },
  { href: '/login', label: 'Parent / Staff Login' },
]

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-clw-gold/20 bg-clw-black text-clw-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/images/textures/mat-dark.webp')] bg-cover bg-center opacity-45" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(240,192,32,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.72))]" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16 2xl:px-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.9fr_1.2fr] lg:gap-12">
          <div>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- supplied transparent gold brand seal */}
              <img
                src="/images/real/clw_star_stamp_yellow_gold.png"
                alt=""
                aria-hidden
                className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
              />
              <div>
                <p className="font-cond text-sm uppercase tracking-[0.26em] text-clw-gold">McHenry County, Illinois</p>
                <p className="mt-2 font-display text-3xl uppercase leading-none tracking-wide text-clw-white sm:text-4xl">
                  Wizards Wrestling
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">About Us</p>
            <nav className="mt-5 flex flex-col gap-3 text-base text-clw-gray sm:text-lg lg:text-base">
              {ABOUT_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="transition hover:text-clw-gold">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Quicklinks</p>
            <nav className="mt-5 flex flex-col gap-3 text-base text-clw-gray sm:text-lg lg:text-base">
              {QUICK_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="transition hover:text-clw-gold">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Get in Touch</p>
            <div className="mt-5 space-y-5 text-base leading-relaxed text-clw-gray sm:text-lg lg:text-base">
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 transition hover:text-clw-gold"
              >
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                <span>
                  975 Nimco Dr, Unit L
                  <br />
                  Crystal Lake, IL 60014
                </span>
              </a>

              <a href={`mailto:${ORG.contactEmail}`} className="flex items-center gap-3 break-all transition hover:text-clw-gold">
                <Mail className="h-5 w-5 shrink-0 text-clw-gold" />
                <span>{ORG.contactEmail}</span>
              </a>

              {ORG.social.facebook && (
                <a
                  href={ORG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 transition hover:text-clw-gold"
                  aria-label="Wizards Wrestling on Facebook"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-clw-gold/35 text-clw-gold">
                    <Facebook className="h-5 w-5" />
                  </span>
                  <span>Follow us on Facebook</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-clw-white/10 pt-7 font-body text-sm sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-clw-gray/70">© {new Date().getFullYear()} Wizards Wrestling Club. All rights reserved.</p>
          <a
            href="https://creativeeyestudios.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group font-body text-sm text-clw-gray/70 transition hover:text-clw-gray/85"
          >
            Meticulously crafted by{' '}
            <span className="font-bold text-clw-gray/50 transition group-hover:text-cyan-400">Creative Eye Studios</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
