# Password recovery monitor

The public reset route retries temporary Supabase and Resend failures and only
claims success after Resend accepts the message. The scheduled canary then
uses the same route and checks delivery through Resend's sent-email API.
When an address has no Supabase account, the public response remains private,
but the club receives an alert with the address for follow-up. The confirmation
screen directs parents to contact the club if no email arrives in 10 minutes.

## Production activation

1. Confirm that the test parent account `rjlbarnes92@gmail.com` still exists
   in Supabase Auth and is controlled by the club. Do not use a real family's
   account. This account will receive one reset email per day.
2. In Vercel Production, set `PASSWORD_RESET_CANARY_EMAIL` to that address.
   Confirm the existing `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
   Supabase URL, and service role key are present. Never put secrets in GitHub.
3. In Resend, create a separate full-access API key named `CLW recovery audit`
   and store it as `RESEND_AUDIT_API_KEY` in Vercel Production. Resend requires
   broader permission for `GET /emails`; keep the existing `RESEND_API_KEY`
   send-only. The older SDK cannot list email, so the audit calls Resend's
   documented read API directly. Do not paste either key into a PR or chat.
4. Deploy the branch after step 2. Trigger the authorized cron route once,
   then check `/api/health/password-recovery` after delivery. It must return
   `{ "ok": true, "reason": "delivered" }`. Also inspect the canary inbox.
5. Check that GitHub Actions notifications for the Production monitor are
   delivered to an owner who responds to incidents. Force one safe failed
   health check in a test environment and confirm the notification arrives.

## What runs afterward

- Daily 11:00 UTC: Vercel Cron sends a real recovery email to the test account.
- Every two hours: GitHub Actions calls the production health route. It fails
  if the canary lacks a successful provider delivery in the past 26 hours,
  Resend cannot be queried, or any recovery email from the past 26 hours has
  bounced, been suppressed, failed, or remained undelivered after 30 minutes.
- The health route returns only a status and generic reason. It does not
  return addresses, messages, or reset tokens.

Resend's `delivered` status means a receiving mail server accepted the message.
It does not guarantee placement in every inbox. Check the canary inbox and
complete a human reset/login journey periodically, particularly after changes
to Supabase, Turnstile, DNS, or email settings. If a health check fails, use
the recovery request ID and Resend message ID in Vercel logs to trace it.
