/**
 * Last check on an email body before it goes to every family (the blast
 * route). The composer already builds safe HTML; this refuses anything that
 * slipped past it, whoever sent the request:
 * - a picture from anywhere but the club's own comms-images storage (an
 *   outside picture tells that site who opened the email, and when),
 * - scripts, frames, forms and embedded objects,
 * - event handlers (onclick=...) and javascript: or data: addresses.
 * Returns what is wrong, or null when the body is fine.
 */
export function commsImagePrefix(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/comms-images/`
}

export function emailBodyProblem(html: string, imagePrefix: string | null): string | null {
  if (/<\s*(script|iframe|frame|object|embed|form|input|button|meta|link|base|style|svg|math)\b/i.test(html)) {
    return 'The message has content that can’t be emailed. Remove it and try again.'
  }
  if (/<[^>]*\son\w+\s*=/i.test(html)) return 'The message has content that can’t be emailed. Remove it and try again.'
  if (/(href|src)\s*=\s*["']?\s*(javascript|data|vbscript):/i.test(html)) {
    return 'The message has a link or picture that can’t be emailed. Remove it and try again.'
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\ssrc\s*=\s*"([^"]*)"/i.exec(match[0])?.[1]
    if (!src || !imagePrefix || !src.startsWith(imagePrefix)) {
      return 'Pictures must be added with Picture, paste or drag, not copied from a website. Remove that picture and add it again.'
    }
  }
  return null
}
