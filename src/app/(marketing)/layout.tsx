import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-clw-black">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  )
}
