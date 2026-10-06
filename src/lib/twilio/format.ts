// How every club text reads. Carriers expect a message to name who it is from
// and to say how to stop, so a text is always "CLW Wizards: ..." and always
// carries the STOP line, whatever the admin typed.

export const SMS_BRAND = 'CLW Wizards'
const OPT_OUT_LINE = 'Reply STOP to opt out.'

/** The admin's text as it will arrive: brand first, opt-out line last. */
export function clubSms(text: string): string {
  let body = text.replace(/[ \t]+\n/g, '\n').trim()
  if (!new RegExp(`^${SMS_BRAND}\\b`, 'i').test(body)) body = `${SMS_BRAND}: ${body}`
  if (!/\bSTOP\b/.test(body)) body = `${body} ${OPT_OUT_LINE}`
  return body
}

/**
 * How many texts one message is billed as. Plain text fits 160 characters in
 * one text and 153 per part when split; anything outside basic ASCII (emoji,
 * curly quotes) drops that to 70 and 67.
 */
export function smsSegments(body: string): number {
  if (!body) return 0
  const unicode = /[^\x00-\x7F]/.test(body)
  const single = unicode ? 70 : 160
  const multi = unicode ? 67 : 153
  const length = [...body].length
  return length <= single ? 1 : Math.ceil(length / multi)
}
