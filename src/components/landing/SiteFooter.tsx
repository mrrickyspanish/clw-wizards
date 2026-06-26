import Link from 'next/link'
import { Facebook } from 'lucide-react'

import { ORG } from '@/config/org.config'

export function SiteFooter() {
  return (
    <footer className="bg-clw-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-10 text-center text-sm text-clw-gray">
        <p className="font-display text-lg text-clw-gold">{ORG.name}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs uppercase tracking-wide">
          <Link href="/about" className="hover:text-clw-gold">
            About
          </Link>
          <Link href="/faq" className="hover:text-clw-gold">
            FAQ
          </Link>
          <Link href="/sponsorship" className="hover:text-clw-gold">
            Sponsorship
          </Link>
          <a href={`mailto:${ORG.contactEmail}`} className="hover:text-clw-gold">
            Contact
          </a>
        </nav>
        {ORG.social.facebook && (
          <a
            href={ORG.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Crystal Lake Wizards on Facebook"
            className="text-clw-gray hover:text-clw-gold"
          >
            <Facebook className="h-5 w-5" />
          </a>
        )}
        <p>
          <a href={`mailto:${ORG.contactEmail}`} className="hover:text-clw-gold">
            {ORG.contactEmail}
          </a>
        </p>
        <p className="text-clw-gray/60">
          © {new Date().getFullYear()} {ORG.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
