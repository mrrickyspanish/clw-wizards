-- Referenced but not defined by the brief (Phase 3.7: "Write to donations table
-- (create this table)"). Donors are not necessarily parents/profiles, so this
-- captures the Stripe customer info directly rather than FK-ing to profiles.
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT,
  donor_email TEXT,
  amount_cents INTEGER NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT false,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  thank_you_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_donations" ON public.donations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Writes happen exclusively through the service-role client in the Stripe
-- webhook handler, which bypasses RLS by design.
