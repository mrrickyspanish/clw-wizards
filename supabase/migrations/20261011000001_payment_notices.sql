-- Payment notices: who gets an email each time money moves through Stripe
-- (dues, donations, sponsorships, renewals, refunds, disputes, failed
-- recurring payments). Same shape and rules as board_copy_recipients;
-- managed in Admin -> Communications -> Payment notices. See
-- src/lib/payments/notice.ts.

CREATE TABLE public.payment_notice_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX payment_notice_recipients_email_key ON public.payment_notice_recipients (lower(email));

ALTER TABLE public.payment_notice_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_payment_notice_recipients" ON public.payment_notice_recipients
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tony asked (Oct 11) for himself and Sabrina.
INSERT INTO public.payment_notice_recipients (name, email) VALUES
  ('Tony Fontanetta', 'arfont37@sbcglobal.net'),
  ('Sabrina Jimenez', 'sabrina@clwizards.com');
