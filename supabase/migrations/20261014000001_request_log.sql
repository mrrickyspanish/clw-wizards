-- A running record of what the club asked for and what was done about it:
-- Google Form adds, payment questions, co-parent access, name fixes, site
-- fixes. Filled in by the site's support (Creative Eye) as each request is
-- handled, so Tony and the board can see the history in Admin -> Requests.

CREATE TABLE public.request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL,          -- when the request came in
  from_name TEXT NOT NULL,                   -- who asked: Tony, Tyler, Sabrina, a parent
  title TEXT NOT NULL,                       -- one line: what was asked
  outcome TEXT,                              -- what was done, in plain words
  status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'waiting', 'open')),
  waiting_on TEXT,                           -- for 'waiting': who has the next step
  people TEXT[] NOT NULL DEFAULT '{}',       -- families and wrestlers involved, for search
  handled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX request_log_received_at_idx ON public.request_log (received_at DESC);

ALTER TABLE public.request_log ENABLE ROW LEVEL SECURITY;
-- Admins read it. Rows are written with the service role by support, not from
-- the site.
CREATE POLICY "admin_read_request_log" ON public.request_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
