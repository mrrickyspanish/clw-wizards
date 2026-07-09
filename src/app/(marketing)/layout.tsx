import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site min-h-screen bg-clw-black">
      <SiteHeader />
      <div className="pt-[98px] sm:pt-[100px] lg:pt-[104px]">{children}</div>
      <SiteFooter />
    </div>
  )
}
