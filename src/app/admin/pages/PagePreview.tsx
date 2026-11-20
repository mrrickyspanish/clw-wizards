/* eslint-disable @next/next/no-img-element */
// Church demo Pages mock: how a page built from a template will look on the
// church site. Layout, fonts and photo spots are fixed by the template; only
// the values change. Phone or desktop width.

import { Play } from 'lucide-react'

import type { PageTemplate, PageValues, Value } from '@/lib/demo-pages'

const str = (v: Value | undefined) => (typeof v === 'string' ? v : '')
const list = (v: Value | undefined) => (Array.isArray(v) ? v : [])

type Props = { template: PageTemplate; values: PageValues; hidden: string[]; phone: boolean }

function Btn({ children, ghost }: { children: React.ReactNode; ghost?: boolean }) {
  if (!children) return null
  return (
    <span
      className={`inline-flex items-center rounded-md px-4 py-2.5 text-base font-bold ${ghost ? 'border border-[#1C1C1B] text-[#1C1C1B]' : 'bg-[#DAB21C] text-[#16213A]'}`}
    >
      {children}
    </span>
  )
}

function Photo({ src, ratio, className = '' }: { src: string; ratio: string; className?: string }) {
  return <img src={src || '/images/sbc-pages/greeters.jpg'} alt="" className={`w-full object-cover ${className}`} style={{ aspectRatio: ratio.replace(':', '/') }} />
}

function Faq({ values }: { values: PageValues }) {
  return (
    <div className="space-y-2">
      <h3 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h3>
      {list(values['faq.items']).map((f, i) => (
        <div key={i} className="rounded-md bg-white p-3">
          <p className="text-base font-semibold">{f.q}</p>
          <p className="text-base text-[#353535]">{f.a}</p>
        </div>
      ))}
    </div>
  )
}

function Story({ values: v, hidden, phone }: Omit<Props, 'template'>) {
  const show = (k: string) => !hidden.includes(k)
  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-xl">
        <Photo src={str(v['banner.photo'])} ratio="16:9" />
        <p className={`absolute inset-x-0 bottom-3 text-center font-bold lowercase tracking-tight text-white drop-shadow ${phone ? 'text-4xl' : 'text-6xl'}`}>
          {str(v['banner.name'])}
        </p>
      </div>
      <div className="space-y-3 text-center">
        <p className={`font-bold tracking-tight ${phone ? 'text-3xl' : 'text-4xl'}`}>{str(v['statement.lead'])}</p>
        <p className="mx-auto max-w-prose text-base text-[#353535]">{str(v['statement.intro'])}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Btn>{str(v['statement.primary'])}</Btn>
          <Btn ghost>{str(v['statement.secondary'])}</Btn>
        </div>
      </div>
      <div className="space-y-3">
        <p className={`text-center font-bold tracking-tight ${phone ? 'text-3xl' : 'text-4xl'}`}>{str(v['welcome.heading'])}</p>
        <div className={`grid gap-3 ${phone ? '' : 'grid-cols-[3fr_2fr] items-end'}`}>
          <Photo src={str(v['welcome.photo'])} ratio="4:5" className="rounded-lg" />
          <div className="rotate-[-2deg] rounded-lg bg-white p-3 shadow">
            <Photo src={str(v['welcome.photo'])} ratio="4:3" />
            <p className="pt-2 text-base font-bold">{str(v['welcome.place'])}</p>
            <p className="text-base text-[#5E5D59]">{str(v['welcome.time'])}</p>
          </div>
        </div>
      </div>
      {show('scripture') && (
        <div className="text-center">
          <p className="font-serif text-2xl italic">&ldquo;{str(v['scripture.verse'])}&rdquo;</p>
          <p className="pt-2 text-base text-[#5E5D59]">{str(v['scripture.ref'])}</p>
        </div>
      )}
      <div className="space-y-3">
        <p className="text-center font-serif text-3xl italic">{str(v['resources.heading'])}</p>
        <div className={`grid gap-3 ${phone ? '' : 'grid-cols-3'}`}>
          {list(v['resources.cards']).map((c, i) => (
            <div key={i} className="rounded-lg bg-white p-2.5">
              <Photo src={c.photo} ratio="1:1" />
              <p className="pt-2 text-lg font-bold">{c.title}</p>
              <p className="text-base text-[#353535]">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
      {show('panel') && (
        <div className="space-y-3 rounded-xl bg-[#1D1C1A] p-5 text-white">
          <p className="text-3xl font-bold tracking-tight">{str(v['panel.heading'])}</p>
          <p className="text-base text-white/80">{str(v['panel.text'])}</p>
          <ul className="space-y-1.5">
            {list(v['panel.points']).map((p, i) => (
              <li key={i} className="border-t border-white/15 pt-1.5 text-base">
                {p.point}
              </li>
            ))}
          </ul>
          <Btn>{str(v['panel.button'])}</Btn>
        </div>
      )}
      {show('faq') && <Faq values={v} />}
      <div className="space-y-2 text-center">
        <p className="text-3xl font-bold tracking-tight">{str(v['contact.heading'])}</p>
        <p className="text-base text-[#353535]">{str(v['contact.text'])}</p>
        <Btn>{str(v['contact.button'])}</Btn>
      </div>
    </div>
  )
}

function Involved({ values: v, hidden, phone }: Omit<Props, 'template'>) {
  const show = (k: string) => !hidden.includes(k)
  return (
    <div className="space-y-10">
      <div className={`grid gap-4 ${phone ? '' : 'grid-cols-2 items-start'}`}>
        <div className="space-y-3">
          <p className={`font-bold tracking-tight ${phone ? 'text-5xl' : 'text-6xl'}`}>{str(v['top.name'])}</p>
          {!phone && (
            <div className="rotate-[2deg] rounded-lg bg-white p-2.5 shadow">
              <Photo src={str(v['top.photo'])} ratio="4:5" />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-[#111] p-2">
            <Photo src={str(v['intro.media'])} ratio={phone ? '4:5' : '16:9'} className="rounded-md" />
            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90">
              <Play className="h-5 w-5 text-[#1C1C1B]" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {str(v['intro.bold'])} <span className="font-serif font-normal italic">{str(v['intro.italic'])}</span>
          </p>
          <p className="font-serif text-xl italic text-[#5B3FD9]">{str(v['intro.accent'])}</p>
          <p className="text-base text-[#353535]">{str(v['intro.text'])}</p>
          <div className="flex flex-wrap gap-2">
            <Btn>{str(v['intro.primary'])}</Btn>
            <Btn ghost>{str(v['intro.secondary'])}</Btn>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="font-serif text-3xl italic">{str(v['options.heading'])}</p>
        <p className="text-base text-[#5E5D59]">{str(v['options.sub'])}</p>
        <div className={`grid gap-3 ${phone ? '' : 'grid-cols-2'}`}>
          {list(v['options.cards']).map((c, i) => (
            <div key={i} className="rounded-lg bg-white p-2.5">
              <Photo src={c.photo} ratio="4:3" />
              <p className="pt-2 text-lg font-bold">{c.title}</p>
              <p className="text-base text-[#353535]">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
      {show('events') && (
        <div className="space-y-2">
          <p className="font-serif text-3xl italic">Coming Up</p>
          {['Sunday, Nov 29', 'Saturday, Dec 5', 'Sunday, Dec 13'].map((d, i) => (
            <div key={d} className="flex items-center justify-between rounded-md bg-white p-3 text-base">
              <span className="font-semibold">Sample event {i + 1}</span>
              <span className="text-[#5E5D59]">{d}</span>
            </div>
          ))}
          <p className="text-sm text-[#5E5D59]">Filled in automatically from this ministry&apos;s calendar.</p>
        </div>
      )}
      <div className="space-y-2 rounded-xl bg-white p-5">
        <p className="text-3xl font-bold tracking-tight">{str(v['join.heading'])}</p>
        <p className="text-base text-[#353535]">{str(v['join.text'])}</p>
        <Btn>{str(v['join.button'])}</Btn>
      </div>
      {show('faq') && <Faq values={v} />}
    </div>
  )
}

function Announcement({ values: v, hidden, phone }: Omit<Props, 'template'>) {
  const show = (k: string) => !hidden.includes(k)
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#5E5D59]">Home page card</p>
        <div className={`overflow-hidden rounded-xl bg-[#1D1C1A] text-white ${phone ? '' : 'grid grid-cols-[3fr_2fr]'}`}>
          <Photo src={str(v['card.photo'])} ratio="16:9" />
          <div className="space-y-2 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/70">
              {str(v['card.label'])} · {str(v['card.date'])}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {str(v['card.bold'])} <span className="font-serif font-normal italic">{str(v['card.italic'])}</span>
            </p>
            <p className="text-base text-white/80">{str(v['card.text'])}</p>
            <Btn>{str(v['card.button'])}</Btn>
          </div>
        </div>
        {(str(v['card.from']) || str(v['card.until'])) && (
          <p className="text-sm text-[#5E5D59]">
            Shows on the home page from {str(v['card.from']) || 'publish'} until {str(v['card.until']) || 'taken down'}.
          </p>
        )}
      </div>
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#5E5D59]">Its page</p>
        <Photo src={str(v['card.photo'])} ratio="16:9" className="rounded-xl" />
        <p className={`font-bold tracking-tight ${phone ? 'text-4xl' : 'text-5xl'}`}>
          {str(v['card.bold'])} <span className="font-serif font-normal italic">{str(v['card.italic'])}</span>
        </p>
        {show('when') && (
          <div className={`grid gap-2 rounded-lg bg-white p-4 text-base ${phone ? '' : 'grid-cols-3'}`}>
            <p>
              <span className="block text-sm text-[#5E5D59]">Date</span>
              <b>{str(v['when.date'])}</b>
            </p>
            <p>
              <span className="block text-sm text-[#5E5D59]">Time</span>
              <b>{str(v['when.time'])}</b>
            </p>
            <p>
              <span className="block text-sm text-[#5E5D59]">Place</span>
              <b>{str(v['when.place'])}</b>
            </p>
          </div>
        )}
        <p className="text-base text-[#353535]">{str(v['details.text'])}</p>
        {show('schedule') && (
          <div className="space-y-1">
            {list(v['schedule.rows']).map((r, i) => (
              <div key={i} className="flex gap-4 border-t border-[#CFCDC6] pt-1.5 text-base">
                <span className="w-20 shrink-0 font-semibold">{r.time}</span>
                <span>{r.what}</span>
              </div>
            ))}
          </div>
        )}
        {show('gallery') && (
          <div className={`grid gap-2 ${phone ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {list(v['gallery.photos']).map((g, i) => (
              <Photo key={i} src={g.photo} ratio="1:1" className="rounded-md" />
            ))}
          </div>
        )}
        <Btn>{str(v['signup.button'])}</Btn>
      </div>
    </div>
  )
}

export function PagePreview({ template, values, hidden, phone }: Props) {
  const Body = template.key === 'story' ? Story : template.key === 'involved' ? Involved : Announcement
  return (
    <div className={`mx-auto overflow-hidden rounded-2xl border border-clw-gold/30 bg-[#DFDED9] text-[#1C1C1B] ${phone ? 'max-w-[390px]' : 'w-full'}`}>
      <div className="flex items-center justify-between border-b border-black/10 bg-[#DFDED9] px-4 py-2.5">
        <span className="text-base font-bold">Second Baptist Church</span>
        <span className="rounded-md bg-[#DAB21C] px-3 py-1 text-sm font-bold text-[#16213A]">Give</span>
      </div>
      <div className={phone ? 'p-4' : 'p-6'}>
        <Body values={values} hidden={hidden} phone={phone} />
      </div>
    </div>
  )
}
