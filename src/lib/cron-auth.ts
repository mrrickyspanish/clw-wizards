/**
 * Vercel invokes cron routes over the public internet, so without this check
 * anyone who finds the path could trigger a mass SMS/email blast. Vercel
 * automatically sends `Authorization: Bearer ${CRON_SECRET}` on cron-triggered
 * requests when CRON_SECRET is set as an env var.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * The scheduled messages to families (weekly dues, Monday digest, Wednesday
 * and weigh-in reminders) stay off until the club says go and FAMILY_REMINDERS
 * is set to "on" (Ricky, Nov 5). Login alerts and the password-reset check
 * run on the same schedule and don't use this.
 */
export function familyRemindersOn(): boolean {
  return process.env.FAMILY_REMINDERS?.trim() === 'on'
}
