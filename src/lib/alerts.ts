import { Resend } from 'resend'
import { ORG } from '@/config/org.config'

const ALERT_EMAIL = process.env.ALERT_EMAIL ?? ORG.contactEmail

export type IntegrationReadinessState = 'configured' | 'partial' | 'missing' | 'deferred'

export interface IntegrationReadiness {
  id: string
  label: string
  state: IntegrationReadinessState
  configuredVariables: string[]
  missingVariables: string[]
  note: string
}

interface IntegrationDefinition {
  id: string
  label: string
  variables: string[]
  note: string
  deferred?: boolean
}

const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'supabase',
    label: 'Supabase',
    variables: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    note: 'Required for authentication, dashboards, and database access.',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    variables: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    note: 'Requires an external webhook test before accepting real payments.',
  },
  {
    id: 'resend',
    label: 'Resend',
    variables: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
    note: 'The sending domain must also be verified in Resend.',
  },
  {
    id: 'qstash',
    label: 'QStash',
    variables: ['QSTASH_TOKEN', 'QSTASH_CURRENT_SIGNING_KEY', 'QSTASH_NEXT_SIGNING_KEY'],
    note: 'Queues communication jobs. Vercel Cron owns the schedules.',
  },
  {
    id: 'cron',
    label: 'Vercel Cron',
    variables: ['CRON_SECRET'],
    note: 'Do not enable real reminders until recipient and content QA is complete.',
  },
  {
    id: 'analytics',
    label: 'Google Analytics',
    variables: ['NEXT_PUBLIC_GA_ID'],
    note: 'Launch setup item. It does not block staging QA.',
  },
  {
    id: 'turnstile',
    label: 'Cloudflare Turnstile',
    variables: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'],
    note: 'Supabase CAPTCHA protection must also be enabled with the matching secret.',
  },
  {
    id: 'twilio',
    label: 'Twilio SMS',
    variables: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    note: 'Intentionally deferred from MVP 1 pending A2P approval.',
    deferred: true,
  },
]

function hasEnvironmentVariable(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function getIntegrationReadiness(): IntegrationReadiness[] {
  return INTEGRATIONS.map((integration) => {
    const configuredVariables = integration.variables.filter(hasEnvironmentVariable)
    const missingVariables = integration.variables.filter((name) => !hasEnvironmentVariable(name))

    let state: IntegrationReadinessState
    if (integration.deferred && configuredVariables.length === 0) state = 'deferred'
    else if (missingVariables.length === 0) state = 'configured'
    else if (configuredVariables.length > 0) state = 'partial'
    else state = integration.deferred ? 'deferred' : 'missing'

    return { ...integration, state, configuredVariables, missingVariables }
  })
}

let environmentReported = false

/**
 * Logs safe configuration status without exposing values. A production deploy
 * fails fast only when the core Supabase/site configuration is absent. Optional
 * integrations remain warnings because staging intentionally brings them online
 * in phases.
 */
export function reportEnvironmentReadiness() {
  if (environmentReported) return
  environmentReported = true

  const coreVariables = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ]
  const missingCore = coreVariables.filter((name) => !hasEnvironmentVariable(name))

  if (missingCore.length > 0) {
    const message = `[environment] Missing core variables: ${missingCore.join(', ')}`
    if (process.env.VERCEL_ENV === 'production') throw new Error(message)
    console.warn(message)
  }

  for (const integration of getIntegrationReadiness()) {
    if (integration.state === 'missing' || integration.state === 'partial') {
      console.warn(
        `[environment] ${integration.label}: ${integration.state}. Missing: ${integration.missingVariables.join(', ')}`
      )
    }
  }
}

/**
 * Best-effort email notification for failures on money/comms paths (Stripe
 * webhook, checkout, SMS/email blasts). Never throws because a broken alert
 * must not take down the request that triggered it.
 */
export async function sendAlert(subject: string, context: Record<string, unknown> = {}) {
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    console.error(`[alert] Could not send "${subject}" because RESEND_API_KEY is not set.`, context)
    return
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`
  const resend = new Resend(resendKey)

  const detailLines = Object.entries(context)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [ALERT_EMAIL],
      subject: `[${ORG.shortName} Alert] ${subject}`,
      text: `${subject}\n\n${detailLines}\n\nTime: ${new Date().toISOString()}`,
    })
  } catch (err) {
    console.error('[alert] Failed to send alert email:', err)
  }
}
