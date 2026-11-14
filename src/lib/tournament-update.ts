import type { JSONContent } from '@tiptap/react'

import { cleanTrackWrestlingUrl } from '@/lib/tw-roster'

// The weekly tournament update, drafted in the club's usual format (Tyler,
// Nov 13): open tournaments first, then ones not open yet, each grouped by
// month as "Date – Tournament | City". Tyler reads it over and sends it from
// Communications; nothing goes out on its own.

type Tournament = {
  name: string
  date: string
  city: string
  status: string
  external_registration_url: string | null
}

const text = (value: string, bold = false): JSONContent => ({ type: 'text', text: value, ...(bold ? { marks: [{ type: 'bold' }] } : {}) })
const para = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content })

function day(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
}
function month(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' })
}

function section(title: string, list: Tournament[], withLinks: boolean): JSONContent[] {
  if (!list.length) return []
  const out: JSONContent[] = [para(text(title, true))]
  let current = ''
  let items: JSONContent[] = []
  const flush = () => {
    if (items.length) out.push({ type: 'bulletList', content: items })
    items = []
  }
  for (const t of list) {
    const m = month(t.date)
    if (m !== current) {
      flush()
      out.push(para(text(m, true)))
      current = m
    }
    const line: JSONContent[] = [text(`${day(t.date)} – ${t.name} | ${t.city}`)]
    const url = t.external_registration_url
    if (withLinks && url && /^https:\/\//.test(url)) {
      line.push(text(' – '), { type: 'text', text: 'Register', marks: [{ type: 'link', attrs: { href: cleanTrackWrestlingUrl(url) } }] })
    }
    items.push({ type: 'listItem', content: [para(...line)] })
  }
  flush()
  return out
}

export function tournamentUpdate(tournaments: Tournament[], today: string): { subject: string; content: JSONContent[] } | null {
  const upcoming = tournaments.filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  const open = upcoming.filter((t) => t.status === 'open')
  const notOpen = upcoming.filter((t) => t.status === 'not_open')
  if (!open.length && !notOpen.length) return null
  return {
    subject: 'Wizards tournament update',
    content: [
      ...section('🟢 OPEN — Registration Available', open, true),
      ...section('🔵 NOT OPEN YET — Upcoming Registration', notOpen, false),
    ],
  }
}
