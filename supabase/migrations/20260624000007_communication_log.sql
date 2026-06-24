CREATE TYPE public.comm_channel AS ENUM ('email', 'sms');
CREATE TYPE public.comm_type AS ENUM (
  'tournament_reminder_wednesday',
  'tournament_reminder_weigh_in',
  'dues_reminder',
  'open_tournaments_digest',
  'general_blast',
  'registration_confirmation',
  'welcome'
);

CREATE TABLE public.communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel public.comm_channel NOT NULL,
  comm_type public.comm_type NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT -- Resend message ID or Twilio SID
);

ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_comm_log" ON public.communication_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Writes happen exclusively through the service-role client in webhook/cron/job
-- handlers (see lib/supabase/admin.ts), which bypasses RLS by design — no
-- authenticated-role INSERT policy is needed or granted here.
