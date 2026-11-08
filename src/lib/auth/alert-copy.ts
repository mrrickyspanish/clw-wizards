// Plain-English parent login alerts (Ricky, Nov 2): who, what they were
// trying to do, why it was turned down, and whether they've gotten in since.
// The technical detail stays at the bottom for when it's needed.

export type AlertIncident = {
  id: string
  first_email: string | null
  first_step: string | null
  first_error: unknown
  first_seen: string
}

export type AlertPerson = { name: string | null; signedInAt: string | null } | null

const TRYING_TO: Record<string, string> = {
  confirmation_link: 'confirm their email with the link from their sign-up email',
  reset_link: 'set their password with the link we emailed them',
  password_save: 'save a new password',
  family_setup: 'finish setting up their family',
}

const WHAT_FIXES_IT: Record<string, string> = {
  confirmation_link: 'They can log in at the login page with the password they chose; if that fails, Set or reset password.',
  reset_link: 'On the login page they tap Set or reset password, enter their email, and use the newest email we send.',
  password_save: 'They try again with a longer password; if it keeps failing, Set or reset password sends a fresh link.',
  family_setup: 'They log in again and finish the setup; if it keeps failing, look at their family in Families.',
}

function errorParts(error: unknown) {
  const e = error && typeof error === 'object' ? (error as Record<string, unknown>) : {}
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  return { code: text(e.code), message: text(e.message), status: typeof e.status === 'number' ? e.status : null }
}

/** Why it was turned down, in words. */
export function whyRejected(error: unknown): string {
  const { code, message } = errorParts(error)
  if (code === 'otp_expired') return 'the link had expired or had already been used'
  if (code === 'weak_password') return 'the password was too short or too simple'
  if (code === 'same_password') return 'they typed the password they already have'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'too many tries in a short time'
  return message ? `the site said: "${message}"` : 'the site turned it down'
}

const clubTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

/** "1 minute", "12 minutes", "3 hours" between two times. */
function howLong(from: string, to: string) {
  const minutes = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 60000))
  if (minutes < 90) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.round(minutes / 60)
  return `${hours} hours`
}

const whoLabel = (incident: AlertIncident, person: AlertPerson) =>
  person?.name ? `${person.name} (${incident.first_email})` : incident.first_email ?? 'A parent (we could not tell who)'

const shortName = (incident: AlertIncident, person: AlertPerson) =>
  person?.name ?? incident.first_email ?? 'A parent'

function details(incident: AlertIncident) {
  const { code, message, status } = errorParts(incident.first_error)
  return [
    '',
    '---',
    `Details: step ${incident.first_step ?? 'unknown'}, error ${code || 'none'}${status ? ` (${status})` : ''}${
      message ? `, "${message}"` : ''
    }`,
    `Reference: ${incident.id}`,
  ]
}

/** True when the parent has logged in since the failure. */
export const gotInSince = (incident: AlertIncident, person: AlertPerson) =>
  Boolean(person?.signedInAt && Date.parse(person.signedInAt) > Date.parse(incident.first_seen))

/** The first email, sent once the timer is up: either "got in" or "can't get in yet". */
export function firstAlert(incident: AlertIncident, person: AlertPerson, club: string) {
  const step = incident.first_step ?? ''
  const tried = `${whoLabel(incident, person)} tried to ${TRYING_TO[step] ?? 'log in'} at ${clubTime(incident.first_seen)}, and it was turned down: ${whyRejected(incident.first_error)}.`
  if (gotInSince(incident, person)) {
    return {
      resolved: true,
      subject: `[${club}] ${shortName(incident, person)} had a login hiccup, then got in`,
      text: [
        tried,
        '',
        `They logged in ${howLong(incident.first_seen, person!.signedInAt!)} later (${clubTime(person!.signedInAt!)}), so there's nothing to do.`,
        ...details(incident),
      ].join('\n'),
    }
  }
  return {
    resolved: false,
    subject: `[${club}] ${shortName(incident, person)} can't get in yet`,
    text: [
      tried,
      '',
      `They haven't logged in since.`,
      `What usually fixes it: ${WHAT_FIXES_IT[step] ?? 'Set or reset password on the login page.'}`,
      '',
      "You'll get a follow-up email here as soon as they get in.",
      ...details(incident),
    ].join('\n'),
  }
}

/** The follow-up when someone who was stuck logs in. */
export function resolvedAlert(incident: AlertIncident, person: NonNullable<AlertPerson>, club: string) {
  return {
    subject: `[${club}] Resolved: ${shortName(incident, person)} got in`,
    text: [
      `${whoLabel(incident, person)} logged in at ${clubTime(person.signedInAt!)}.`,
      `That closes the alert from ${clubTime(incident.first_seen)} (${whyRejected(incident.first_error)}). Nothing else to do.`,
      '',
      '---',
      `Reference: ${incident.id}`,
    ].join('\n'),
  }
}
