-- Tournament sessions and a street address (Tyler, Nov 14 video: B2 and B3).
--
-- 1. Sessions. A tournament can run in up to five sessions, each with a start
--    time and the divisions it covers as free text ("Tots, Bantam,
--    Intermediate"). Sessions are public, like the tournament itself, because
--    they show on Events. tournaments.start_time stays as it is and is kept
--    equal to the earliest session start by replace_tournament_sessions, so
--    the homepage, ticker, reminders and calendar keep working unchanged.
--    Existing tournaments get no sessions here (no backfill).
--
-- 2. Street address. Optional, so the venue can link to a map by street
--    address instead of only the venue name.

ALTER TABLE public.tournaments
  ADD COLUMN street_address TEXT
    CONSTRAINT tournaments_street_address_length CHECK (street_address IS NULL OR char_length(street_address) <= 200);

CREATE TABLE public.tournament_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  -- 'HH:MM' 24-hour, the same format as tournaments.start_time from the admin form.
  start_time TEXT NOT NULL
    CONSTRAINT tournament_sessions_start_time_format CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  divisions TEXT
    CONSTRAINT tournament_sessions_divisions_length CHECK (divisions IS NULL OR char_length(divisions) <= 120),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX tournament_sessions_tournament_id_idx ON public.tournament_sessions (tournament_id);

ALTER TABLE public.tournament_sessions ENABLE ROW LEVEL SECURITY;

-- Readable wherever its tournament is (tournaments are public); admins manage them.
CREATE POLICY "public_read_tournament_sessions" ON public.tournament_sessions
  FOR SELECT USING (true);
CREATE POLICY "admin_write_tournament_sessions" ON public.tournament_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Replaces a tournament's sessions in one step, so a failed save never leaves
-- half the old list and half the new one. p_sessions is a JSON array of
-- {start_time, divisions}, in the order to show them. Sets
-- tournaments.start_time to the earliest session start; an empty list leaves
-- it as it was. Runs as the caller, so RLS applies as well as the admin check.
CREATE OR REPLACE FUNCTION public.replace_tournament_sessions(p_tournament UUID, p_sessions JSONB)
RETURNS INTEGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  n INTEGER;
  v_first TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF p_sessions IS NULL OR jsonb_typeof(p_sessions) <> 'array' OR jsonb_array_length(p_sessions) > 5 THEN
    RAISE EXCEPTION 'Bad session list';
  END IF;

  DELETE FROM public.tournament_sessions WHERE tournament_id = p_tournament;
  INSERT INTO public.tournament_sessions (tournament_id, start_time, divisions, sort_order)
  SELECT p_tournament, e->>'start_time', nullif(btrim(left(e->>'divisions', 120)), ''), (x.ord - 1)::INTEGER
  FROM jsonb_array_elements(p_sessions) WITH ORDINALITY AS x(e, ord);
  GET DIAGNOSTICS n = ROW_COUNT;

  IF n > 0 THEN
    -- 'HH:MM' with a leading zero sorts as text in time order.
    SELECT min(s.start_time) INTO v_first FROM public.tournament_sessions s WHERE s.tournament_id = p_tournament;
    UPDATE public.tournaments SET start_time = v_first WHERE id = p_tournament;
  END IF;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.replace_tournament_sessions(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_tournament_sessions(UUID, JSONB) TO authenticated;
