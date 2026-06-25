import { ORG } from '@/config/org.config'

export function SiteFooter() {
  return (
    <footer className="bg-clw-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-10 text-center text-sm text-clw-gray">
        <p className="font-display text-lg text-clw-gold">{ORG.name}</p>
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
