import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { getExtraNavLink } from '@/lib/content/get'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const extraLink = await getExtraNavLink()
  return (
    <div className="marketing-site min-h-screen bg-clw-black">
      <SiteHeader extraLink={extraLink} />
      <div className="pt-[146px] sm:pt-[150px] min-[1180px]:pt-[148px]">{children}</div>
      <SiteFooter />
    </div>
  )
}
