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
