import { ORG } from '@/config/org.config'

/**
 * Nonprofit status and EIN, shown wherever the site asks for money so a donor
 * or business has what their records need without emailing to ask.
 *
 * Charitable gifts and corporate sponsorships are not treated the same way at
 * tax time -- a sponsorship is usually a business expense rather than a
 * charitable deduction -- so the wording differs by variant and neither one
 * promises a specific outcome.
 */
export function TaxStatusNote({
  variant = 'donation',
  className = '',
}: {
  variant?: 'donation' | 'sponsorship'
  className?: string
}) {
  return (
    <p className={`text-sm leading-relaxed ${className}`}>
      {ORG.name} is a registered 501(c)(3) nonprofit organization. EIN {ORG.ein}.{' '}
      {variant === 'donation'
        ? 'Donations are tax-deductible to the extent allowed by law. You will receive an emailed receipt after checkout.'
        : 'Sponsorship may qualify as a deductible business expense rather than a charitable donation. Please check with your tax advisor.'}
    </p>
  )
}
