import type { ReactNode } from 'react'

/** One headed section of a policy page (Privacy Policy, SMS Terms). */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-3xl uppercase leading-none text-clw-white">{title}</h2>
      <div className="mt-5 space-y-4 text-base leading-relaxed text-clw-gray">{children}</div>
    </section>
  )
}
