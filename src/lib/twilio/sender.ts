/**
 * Who club texts are sent from. A Messaging Service (TWILIO_MESSAGING_SERVICE_SID)
 * is preferred: it is what the toll-free verification and STOP handling are
 * attached to. A bare TWILIO_PHONE_NUMBER still works on its own.
 */
export function twilioSender(): { messagingServiceSid: string } | { from: string } | null {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  if (messagingServiceSid) return { messagingServiceSid }
  const from = process.env.TWILIO_PHONE_NUMBER?.trim()
  return from ? { from } : null
}

/** Can this environment send texts at all? Credentials plus a sender. */
export function smsReady(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim() && twilioSender())
}
