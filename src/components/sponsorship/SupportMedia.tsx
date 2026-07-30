import { cn } from '@/lib/utils'

export function SupportMedia({
  src,
  alt,
  className = '',
  position = 'center',
  dim = 'bg-clw-black/20',
}: {
  src: string
  alt: string
  className?: string
  position?: string
  dim?: string
}) {
  return (
    // cn() merges Tailwind conflicts, so a caller passing `absolute inset-0`
    // overrides the default `relative` instead of losing to it in the cascade
    // and collapsing this box to zero height.
    <div className={cn('relative overflow-hidden bg-clw-black-3', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- repo-sourced club photography */}
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover grayscale" style={{ objectPosition: position }} />
      <div className={`absolute inset-0 ${dim}`} />
    </div>
  )
}

export function GoldRule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-clw-gold/45 ${className}`} />
}
