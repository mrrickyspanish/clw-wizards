-- Paying dues in parts (Tyler, Oct 24: payment plan families pay a custom
-- amount toward the balance).
--
-- A dues record only kept its latest Stripe payment. With more than one
-- payment, a refund of an earlier one found no record (or, worse, reset the
-- paid total to that one payment), and a late redelivery of an earlier
-- payment's event could count it twice. dues_charges keeps every card payment
-- on a dues record, and two functions apply payments and refunds to the
-- record in one step:
--   record_dues_charge  adds a payment once per checkout, however often Stripe
--                       sends the event,
--   record_dues_refund  takes off only what a refund changed on that payment.
-- Payments recorded by hand on the Dues page (cash, check) are not in here;
-- they still change amount_paid_cents directly, and nothing below undoes them.

CREATE TABLE public.dues_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dues_id UUID NOT NULL REFERENCES public.dues_payments(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  -- What the card was charged, and what is still kept after any refund.
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  net_cents INTEGER NOT NULL CHECK (net_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX dues_charges_dues_idx ON public.dues_charges (dues_id);

CREATE TRIGGER update_dues_charges_updated_at
  BEFORE UPDATE ON public.dues_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.dues_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_dues_charges" ON public.dues_charges
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Every card payment already on file: one per dues record, which is all the
-- site allowed until now. What it still holds is what the record shows paid.
INSERT INTO public.dues_charges (dues_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, net_cents, created_at)
SELECT id, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, amount_paid_cents, updated_at
FROM public.dues_payments
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_dues_charge(
  _dues UUID, _session TEXT, _intent TEXT, _amount INTEGER
) RETURNS TABLE (
  applied BOOLEAN, parent_id UUID, athlete_id UUID, season TEXT,
  amount_cents INTEGER, amount_paid_cents INTEGER, status TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_charge UUID;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment amount for dues %', _dues;
  END IF;
  PERFORM 1 FROM public.dues_payments d WHERE d.id = _dues FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dues record % not found', _dues;
  END IF;

  INSERT INTO public.dues_charges (dues_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, net_cents)
  VALUES (_dues, _session, _intent, _amount, _amount)
  ON CONFLICT (stripe_checkout_session_id) DO NOTHING
  RETURNING id INTO v_charge;

  IF v_charge IS NULL THEN
    -- Already counted: Stripe sent this payment again.
    RETURN QUERY SELECT FALSE, d.parent_id, d.athlete_id, d.season, d.amount_cents, d.amount_paid_cents, d.status
      FROM public.dues_payments d WHERE d.id = _dues;
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.dues_payments d SET
    amount_paid_cents = LEAST(d.amount_cents, d.amount_paid_cents + _amount),
    status = CASE WHEN d.amount_paid_cents + _amount >= d.amount_cents THEN 'paid' ELSE 'partial' END,
    stripe_payment_intent_id = coalesce(_intent, d.stripe_payment_intent_id),
    stripe_checkout_session_id = _session
  WHERE d.id = _dues
  RETURNING TRUE, d.parent_id, d.athlete_id, d.season, d.amount_cents, d.amount_paid_cents, d.status;
END;
$$;

-- _net: what the charge still holds (charge amount minus everything refunded).
-- Stripe sends the running total, so a redelivered refund changes nothing.
CREATE OR REPLACE FUNCTION public.record_dues_refund(_intent TEXT, _net INTEGER)
RETURNS TABLE (
  found BOOLEAN, changed BOOLEAN, dues_id UUID, parent_id UUID, athlete_id UUID,
  amount_cents INTEGER, paid_before_cents INTEGER, amount_paid_cents INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_charge public.dues_charges%ROWTYPE;
  v_delta INTEGER;
  v_before INTEGER;
BEGIN
  SELECT * INTO v_charge FROM public.dues_charges c WHERE c.stripe_payment_intent_id = _intent FOR UPDATE;
  IF v_charge.id IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, NULL::UUID, NULL::UUID, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT d.amount_paid_cents INTO v_before FROM public.dues_payments d WHERE d.id = v_charge.dues_id FOR UPDATE;
  v_delta := v_charge.net_cents - GREATEST(0, _net);
  IF v_delta <= 0 THEN
    RETURN QUERY SELECT TRUE, FALSE, d.id, d.parent_id, d.athlete_id, d.amount_cents, v_before, d.amount_paid_cents
      FROM public.dues_payments d WHERE d.id = v_charge.dues_id;
    RETURN;
  END IF;

  UPDATE public.dues_charges c SET net_cents = GREATEST(0, _net) WHERE c.id = v_charge.id;
  RETURN QUERY
  UPDATE public.dues_payments d SET
    amount_paid_cents = GREATEST(0, d.amount_paid_cents - v_delta),
    status = CASE
      WHEN d.status = 'waived' THEN d.status
      WHEN d.amount_paid_cents - v_delta <= 0 THEN 'pending'
      WHEN d.amount_paid_cents - v_delta < d.amount_cents THEN 'partial'
      ELSE 'paid'
    END
  WHERE d.id = v_charge.dues_id
  RETURNING TRUE, TRUE, d.id, d.parent_id, d.athlete_id, d.amount_cents, v_before, d.amount_paid_cents;
END;
$$;

-- Only the site's server (the Stripe webhook) applies payments and refunds.
REVOKE EXECUTE ON FUNCTION public.record_dues_charge(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_dues_refund(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
