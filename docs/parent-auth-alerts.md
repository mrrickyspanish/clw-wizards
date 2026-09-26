# Parent authentication alerts

The first observed failure sends an owner email using the existing `ALERT_EMAIL`
(fallback: club contact), `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` settings.
No account state or passwords are changed by reporting.

Covered steps:

- `confirmation_link`: failed confirmation code exchange or provider error returned to the app.
- `reset_link`: failed legacy callback exchange, provider error, or failed verification after the parent submits the reset form. Opening a scanner-safe recovery link still does not consume its token.
- `password_save`: Supabase rejects the new password or the save request throws.
- `family_setup`: authenticated profile lookup fails, the profile is missing/inactive, the session disappears immediately after sign-in, or the family-setup page fails to render.

Unknown-account reset requests remain enumeration-safe and show the signup option.
They no longer send owner emails. Client-side password mismatch/length validation
does not send an incident. Existing pre-send reset service alerts remain intact.

## Grouping and delivery

`parent_auth_incidents` is a private, service-role-only incident/outbox table.
Attempt IDs travel via a short-lived cookie, session storage, and (for new recovery
emails) the link fragment. No password, reset token, session token, or full URL is
stored. New recovery attempts remember the recipient before sending, so failed
verification can still identify the parent. Browser-supplied emails are explicitly
marked unverified; server-known reset recipients take precedence.

One immediate email contains the first failure's address, step, sanitized actual
error/code/status, UTC timestamp, and reference ID. Repeats increment `occurrences`
and update `latest_step`, `latest_error`, and `last_seen`. They do not send additional
emails. First-event fields remain fixed for Resend idempotency. Different new reset
emails have different attempt IDs; they are separate attempts.

An atomic database lease prevents concurrent senders. Failed delivery remains
pending. `/api/crons/parent-auth-alerts` retries every five minutes, requires
`CRON_SECRET`, and returns 503 on delivery failure. Automatic retries stop before
Resend's 24-hour idempotency window expires, preventing an ambiguous old delivery
from sending twice. A pending incident older than ten minutes makes
`/api/health/parent-auth-alerts` return 503; the independent GitHub production
monitor checks that endpoint every two hours. Provider acceptance is recorded
with `message_id`; it does not prove inbox placement.

Anonymous reports are validated, sanitized and limited to 20 new incidents per
source per ten minutes. Browser reporting uses same-origin Next Server Actions.
Ordinary unauthenticated visits do not produce family-setup alerts.

## Investigating a reference

Run a parameterized service-role/admin query against `parent_auth_incidents` by
`id`. Check `first_error`, `latest_error`, `occurrences`, `last_seen`, `notified_at`
and `message_id`. Never request a parent's password or full recovery URL.

## Verification

`npm run test:auth` exercises the real form, callback and reporting modules with
mocked providers: successes stay quiet, unknown accounts stay quiet, failed saves
and links report the right step, concurrent failures send once, failed delivery
can retry with the same payload, and parent routing failures are reported.
Production database checks run within rolled-back transactions verify grouping,
exclusive claims, anonymous-source admission limits, and service-role-only access.

For a live delivery test, use an explicitly synthetic error/reference and the
owner recipient, then verify `message_id` and receipt. Never deliberately break
a parent's account to test monitoring. Real browser signup/reset tests still
require a controlled mailbox and the human security check.

## Limits

These alerts report observed failures, not proof that an entire journey succeeded.
A parent closing a tab is not a failure. A completely offline browser or a failure
before JavaScript loads cannot reliably report immediately. Cross-browser legacy
links may have no available email; the incident still includes its error and
reference. A server-rendering boundary may expose only a framework digest;
profile/query failures are also reported server-side with the underlying error.
If the database is unavailable, safe server logs retain the reference and step;
database and email outages are also exposed by the separate health endpoint.
