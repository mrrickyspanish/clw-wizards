-- Tournaments can be "Not open yet" (Tyler, Oct 30): listed for families, but
-- registration hasn't opened. Treated like closed everywhere a status gates
-- registering or reminders (those only act on 'open').
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_status_check CHECK (status = ANY (ARRAY['open'::text, 'not_open'::text, 'closed'::text, 'cancelled'::text]));
