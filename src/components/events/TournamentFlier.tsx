'use client'

import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'

import { flierKind } from '@/lib/flier'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// A tournament's flier: a picture to tap and see full size, or a button that
// opens a PDF or the tournament's web page.
export function TournamentFlier({ url, name }: { url: string | null; name: string }) {
  const [open, setOpen] = useState(false)
  const kind = flierKind(url)
  if (!kind || !url) return null

  if (kind === 'link') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-clw-gold/40 px-4 text-base text-clw-white hover:border-clw-gold hover:bg-clw-gold/10"
      >
        <FileText className="h-4 w-4 text-clw-gold" /> View flier <ExternalLink className="h-4 w-4 text-clw-gray" />
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block overflow-hidden rounded-md border border-clw-gold/20 bg-clw-black text-left hover:border-clw-gold/60"
        aria-label={`See the ${name} flier full size`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- flier from any site the club links to */}
        <img src={url} alt={`${name} flier`} className="max-h-64 w-auto max-w-full object-contain" loading="lazy" />
        <span className="block px-3 py-2 text-sm text-clw-gray">Tap to see the flier full size</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle className="text-xl text-clw-white">{name}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- flier from any site the club links to */}
          <img src={url} alt={`${name} flier`} className="h-auto w-full rounded-md" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-base text-clw-gold"
          >
            Open full size <ExternalLink className="h-4 w-4" />
          </a>
        </DialogContent>
      </Dialog>
    </>
  )
}
