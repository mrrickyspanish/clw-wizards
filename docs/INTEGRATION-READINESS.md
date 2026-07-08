# CLW Integration Readiness

The current LeagueLineup website remains live until the new build receives final approval.

Use a Vercel Preview deployment for staging. The custom domain is the final launch action.

Vercel owns scheduled jobs. QStash queues communication delivery, so duplicate schedules must not be created in Upstash.

Twilio SMS and recurring donations are outside MVP 1.

Before launch, verify Supabase, Stripe, email delivery, queued jobs, analytics, and signup protection with controlled end-to-end tests.
