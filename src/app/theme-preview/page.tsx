import type { Metadata } from 'next'
import {
  Users,
  Trophy,
  FolderOpen,
  MapPin,
  Ticket,
  Upload,
  Mail,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'

// THROWAWAY: a side-by-side theme comparison for the parent dashboard. Static
// mock data, no auth, not linked anywhere. Delete this route once a theme is
// chosen. Marketing site stays ultra-dark regardless; this only previews the
// authenticated app surface.
export const metadata: Metadata = { title: 'Theme preview', robots: { index: false } }

type Palette = {
  key: string
  name: string
  blurb: string
  pageBg: string
  cardBg: string
  cardBorder: string
  text: string
  muted: string
  gold: string
  goldText: string
  chipBg: string
  rowBg: string
  danger: string
  shadow: string
}

const PALETTES: Palette[] = [
  {
    key: 'A',
    name: 'A — Light + gold',
    blurb: 'Off-white surfaces, near-black text, gold for accents/CTAs only. Max readability.',
    pageBg: '#F4F5F7',
    cardBg: '#FFFFFF',
    cardBorder: '#E6E8EC',
    text: '#18181B',
    muted: '#5A606A',
    gold: '#F0C020',
    goldText: '#8A6D10',
    chipBg: 'rgba(240,192,32,0.16)',
    rowBg: '#F4F5F7',
    danger: '#DC2626',
    shadow: '0 10px 26px -18px rgba(0,0,0,0.25)',
  },
  {
    key: 'B',
    name: 'B — Soft dark + gold',
    blurb: 'Slate base (not pure black), lifted cards, brighter muted text. Refined dark.',
    pageBg: '#14171D',
    cardBg: '#232833',
    cardBorder: 'rgba(240,192,32,0.10)',
    text: '#F2F3F5',
    muted: '#9AA1AC',
    gold: '#F0C020',
    goldText: '#F0C020',
    chipBg: 'rgba(240,192,32,0.12)',
    rowBg: '#1A1E26',
    danger: '#F87171',
    shadow: '0 10px 28px -18px rgba(0,0,0,0.9)',
  },
  {
    key: 'C',
    name: 'C — Ultra-dark (current)',
    blurb: 'What is live today, for reference.',
    pageBg: '#0D0D0D',
    cardBg: '#1C1C1C',
    cardBorder: 'rgba(240,192,32,0.10)',
    text: '#FFFFFF',
    muted: '#6B6B6B',
    gold: '#F0C020',
    goldText: '#F0C020',
    chipBg: 'rgba(240,192,32,0.10)',
    rowBg: '#121212',
    danger: '#F87171',
    shadow: 'none',
  },
]

function Mock({ p }: { p: Palette }) {
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: p.cardBg,
    border: `1px solid ${p.cardBorder}`,
    borderRadius: 18,
    boxShadow: p.shadow,
    ...extra,
  })

  const stats = [
    { label: 'Wrestlers', value: '2', Icon: Users },
    { label: 'Events', value: '3', Icon: Trophy },
    { label: 'Documents', value: '5', Icon: FolderOpen },
  ]
  const actions = [
    { label: 'Register', Icon: Ticket },
    { label: 'Upload', Icon: Upload },
    { label: 'Contact', Icon: Mail },
  ]

  return (
    <div style={{ background: p.pageBg, borderRadius: 28, padding: 16 }} className="mx-auto w-full max-w-[390px]">
      {/* top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full font-display"
            style={{ border: `1px solid ${p.gold}`, color: p.goldText }}
          >
            RT
          </span>
          <div>
            <div style={{ color: p.muted }} className="text-xs">
              Good morning
            </div>
            <div style={{ color: p.text }} className="font-medium leading-tight">
              RJ
            </div>
          </div>
        </div>
        <span style={{ color: p.gold }} className="font-display text-xl">
          CLW
        </span>
      </div>

      {/* hero: next practice */}
      <div style={card({ padding: 20, marginBottom: 12 })}>
        <div style={{ color: p.goldText }} className="text-[11px] font-semibold uppercase tracking-[0.18em]">
          Next practice
        </div>
        <div style={{ color: p.text }} className="mt-2 font-display text-3xl leading-tight">
          Tomorrow · 6:30 PM
        </div>
        <div style={{ color: p.muted }} className="mt-2 flex items-center gap-1.5 text-sm">
          <MapPin className="h-4 w-4" style={{ color: p.gold }} /> Crystal Lake High School
        </div>
        <div style={{ color: p.muted }} className="mt-1 text-sm">
          Gold group
        </div>
      </div>

      {/* balance focal */}
      <div style={card({ padding: 20, marginBottom: 12, borderColor: p.danger })}>
        <div style={{ color: p.danger }} className="text-[11px] font-semibold uppercase tracking-[0.18em]">
          Balance due
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div style={{ color: p.text }} className="font-display text-5xl leading-none">
            $175
          </div>
          <span style={{ background: p.gold, color: '#0D0D0D' }} className="rounded-lg px-4 py-2 text-sm font-medium">
            Pay now
          </span>
        </div>
      </div>

      {/* stat chips */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} style={card({ padding: 14 })}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: p.chipBg, color: p.goldText }}
            >
              <s.Icon className="h-[18px] w-[18px]" />
            </span>
            <div style={{ color: p.text }} className="mt-3 font-display text-2xl leading-none">
              {s.value}
            </div>
            <div style={{ color: p.muted }} className="mt-1 text-xs">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* wrestlers */}
      <div style={card({ padding: 18, marginBottom: 12 })}>
        <div className="mb-3 flex items-center justify-between">
          <span style={{ color: p.text }} className="text-sm font-medium">
            My wrestlers
          </span>
          <span style={{ color: p.goldText }} className="text-sm">
            View all
          </span>
        </div>
        {[
          { n: 'Greyson Walker', d: 'Gold · 72 lb', i: 'GW' },
          { n: 'Gianna Walker', d: 'White · 64 lb', i: 'GW' },
        ].map((a) => (
          <div
            key={a.n}
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ background: p.rowBg }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full font-display"
              style={{ border: `1px solid ${p.gold}`, color: p.goldText }}
            >
              {a.i}
            </span>
            <span className="flex-1">
              <span style={{ color: p.text }} className="block font-medium">
                {a.n}
              </span>
              <span style={{ color: p.muted }} className="block text-sm">
                {a.d}
              </span>
            </span>
            <ChevronRight className="h-4 w-4" style={{ color: p.muted }} />
          </div>
        ))}
      </div>

      {/* this week */}
      <div style={card({ padding: 18, marginBottom: 12 })}>
        <div style={{ color: p.text }} className="mb-3 flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4" style={{ color: p.gold }} /> This week
        </div>
        {[
          { d: 'Tuesday', l: 'Crystal Lake HS', t: '6:30 PM' },
          { d: 'Thursday', l: 'Crystal Lake HS', t: '6:30 PM' },
        ].map((r) => (
          <div
            key={r.d}
            className="mb-2 flex items-center justify-between rounded-xl px-3 py-3"
            style={{ background: p.rowBg }}
          >
            <span>
              <span style={{ color: p.text }} className="block font-medium">
                {r.d}
              </span>
              <span style={{ color: p.muted }} className="block text-sm">
                {r.l}
              </span>
            </span>
            <span style={{ color: p.goldText }} className="text-sm">
              {r.t}
            </span>
          </div>
        ))}
      </div>

      {/* quick actions */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <div key={a.label} style={card({ padding: 16 })} className="flex flex-col items-center gap-2 text-center">
            <a.Icon className="h-5 w-5" style={{ color: p.gold }} />
            <span style={{ color: p.text }} className="text-sm">
              {a.label}
            </span>
          </div>
        ))}
      </div>

      {/* recent activity */}
      <div style={card({ padding: 18 })}>
        <div style={{ color: p.text }} className="mb-3 text-sm font-medium">
          Recent activity
        </div>
        {['Registered for an event', 'Uploaded USA Wrestling card', 'Paid 2025-26 dues'].map((label, i) => (
          <div key={i} className="mb-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#34D399' }} />
            <span style={{ color: p.text }} className="flex-1 text-sm">
              {label}
            </span>
            <span style={{ color: p.muted }} className="text-xs">
              May {14 - i * 3}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ThemePreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-neutral-500 px-4 py-10">
      <div className="mx-auto max-w-[420px] text-center">
        <h1 className="font-display text-3xl text-white">Dashboard theme options</h1>
        <p className="mt-2 text-sm text-white/80">
          Same screen, three palettes. Pick A, B, or C. The public marketing site stays ultra-dark either way; this is
          only the signed-in app.
        </p>
      </div>
      <div className="mt-10 space-y-14">
        {PALETTES.map((p) => (
          <div key={p.key}>
            <div className="mx-auto mb-3 max-w-[390px]">
              <p className="font-display text-xl text-white">{p.name}</p>
              <p className="text-sm text-white/70">{p.blurb}</p>
            </div>
            <Mock p={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
