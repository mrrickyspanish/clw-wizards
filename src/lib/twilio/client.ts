import Twilio from 'twilio'

let client: ReturnType<typeof Twilio> | null = null

export function getTwilioClient() {
  if (client) return client

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('Twilio is not configured: missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.')
  }

  client = Twilio(accountSid, authToken)
  return client
}
