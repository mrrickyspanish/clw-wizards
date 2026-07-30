import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site min-h-screen bg-clw-black">
      <SiteHeader />
      <div className="pt-[146px] sm:pt-[150px] min-[1180px]:pt-[148px]">{children}</div>
      <SiteFooter />
    </div>
  )
}
