-- Registering and paying for a tournament on the club site (Tyler, Nov 14
-- video: B4).
--
-- 1. tournaments.entry_fee_cents: the price per wrestler. NULL means the site
--    takes no payment for this tournament.
--
-- 2. New columns on tournament_registrations: what the family entered
--    (weight, division, grade, the columns TrackWrestling's club list needs)
--    and the payment state (fee_cents, paid_cents, paid_at, payment_method,
--    payment_note). Parents and co-parents can write their own registration
--    rows through the REST API (parents_own_registrations, treg_guardian_all),
--    so a trigger keeps the five payment columns server-only: only the
--    service role (the Stripe webhook and server code) or an admin can change
--    them, the same rule as keep_age_division_admin_only. The same trigger
--    keeps a parent from moving a registration to another tournament or
--    wrestler, so a paid row cannot carry its payment somewhere else.
--
-- 3. tournament_checkouts: one row per card checkout, written only by the
--    server. It keeps working after a tournament is deleted (SET NULL plus a
--    name snapshot), because money records must outlive the tournament.
--
-- 4. record_tournament_payment and record_tournament_refund: the Stripe
--    webhook calls these, modeled on record_dues_charge and
--    record_dues_refund. A repeated Stripe event is never counted twice.

ALTER TABLE public.tournaments
  ADD COLUMN entry_fee_cents INTEGER
    CONSTRAINT tournaments_entry_fee_cents_range CHECK (entry_fee_cents IS NULL OR entry_fee_cents BETWEEN 100 AND 100000);

ALTER TABLE public.tournament_registrations
  ADD COLUMN weight TEXT
    CONSTRAINT tournament_registrations_weight_length CHECK (weight IS NULL OR char_length(weight) <= 20),
  ADD COLUMN division TEXT
    CONSTRAINT tournament_registrations_division_length CHECK (division IS NULL OR char_length(division) <= 60),
  ADD COLUMN grade TEXT
    CONSTRAINT tournament_registrations_grade_length CHECK (grade IS NULL OR char_length(grade) <= 20),
  -- The price locked for this wrestler when checkout starts (later price
  -- changes do not re-price it).
  ADD COLUMN fee_cents INTEGER
    CONSTRAINT tournament_registrations_fee_cents_range CHECK (fee_cents IS NULL OR fee_cents >= 0),
  ADD COLUMN paid_cents INTEGER NOT NULL DEFAULT 0
    CONSTRAINT tournament_registrations_paid_cents_range CHECK (paid_cents >= 0),
  ADD COLUMN paid_at TIMESTAMPTZ,
  ADD COLUMN payment_method TEXT
    CONSTRAINT tournament_registrations_payment_method_check CHECK (payment_method IN ('card', 'cash', 'check', 'waived')),
  ADD COLUMN payment_note TEXT
    CONSTRAINT tournament_registrations_payment_note_length CHECK (payment_note IS NULL OR char_length(payment_note) <= 200);

-- A parent's insert gets the payment defaults; a parent's update keeps the
-- payment columns, the tournament and the wrestler as they were. The service
-- role (auth.uid() is null) and admins pass through unchanged.
CREATE OR REPLACE FUNCTION public.keep_registration_payment_server_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.fee_cents := NULL;
    NEW.paid_cents := 0;
    NEW.paid_at := NULL;
    NEW.payment_method := NULL;
    NEW.payment_note := NULL;
  ELSE
    NEW.fee_cents := OLD.fee_cents;
    NEW.paid_cents := OLD.paid_cents;
    NEW.paid_at := OLD.paid_at;
    NEW.payment_method := OLD.payment_method;
    NEW.payment_note := OLD.payment_note;
    NEW.tournament_id := OLD.tournament_id;
    NEW.athlete_id := OLD.athlete_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Runs only as a trigger; nobody calls it directly.
REVOKE EXECUTE ON FUNCTION public.keep_registration_payment_server_only() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER keep_registration_payment_server_only
  BEFORE INSERT OR UPDATE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.keep_registration_payment_server_only();

CREATE TABLE public.tournament_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  -- Snapshot, so the record still names the tournament after it is deleted.
  tournament_name TEXT NOT NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  registration_ids UUID[] NOT NULL,
  athlete_ids UUID[] NOT NULL,
  amount_cents INTEGER NOT NULL CONSTRAINT tournament_checkouts_amount_positive CHECK (amount_cents > 0),
  -- What the card payment still holds after any refund.
  net_cents INTEGER NOT NULL DEFAULT 0 CONSTRAINT tournament_checkouts_net_nonnegative CHECK (net_cents >= 0),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT tournament_checkouts_status_check CHECK (status IN ('pending', 'paid', 'partially_refunded', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX tournament_checkouts_tournament_id_idx ON public.tournament_checkouts (tournament_id);
CREATE INDEX tournament_checkouts_payer_id_idx ON public.tournament_checkouts (payer_id);

ALTER TABLE public.tournament_checkouts ENABLE ROW LEVEL SECURITY;

-- Admins see every checkout; a family sees its own. Nobody inserts, updates
-- or deletes through the API: only the service role writes here.
CREATE POLICY "admin_read_tournament_checkouts" ON public.tournament_checkouts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payer_read_own_tournament_checkouts" ON public.tournament_checkouts
  FOR SELECT TO authenticated USING (payer_id = auth.uid());

REVOKE ALL ON TABLE public.tournament_checkouts FROM anon;

-- Applies one card payment, once per checkout however often Stripe sends it.
-- The server locks fee_cents on every registration before checkout starts, so
-- a registration with no fee_cents is a server bug: it raises rather than
-- marking a row "card" with nothing paid.
-- Returned flags for the webhook:
--   overpay              any of the checkout's registrations already showed
--                        paid (card, cash, check or waived) before this
--                        payment, so the club should look at it.
--   session_mismatch     the checkout was already settled under a DIFFERENT
--                        Stripe session: money taken but not recorded here.
--   registrations_marked how many registrations this payment marked paid by
--                        card (fewer than the checkout lists when some were
--                        deleted before payment or carry a cash, check or
--                        waived mark, which a card payment never overwrites).
CREATE OR REPLACE FUNCTION public.record_tournament_payment(
  _checkout UUID, _session TEXT, _intent TEXT, _amount INTEGER
) RETURNS TABLE (
  applied BOOLEAN, payer_id UUID, tournament_id UUID, tournament_name TEXT,
  athlete_ids UUID[], amount_cents INTEGER, overpay BOOLEAN,
  session_mismatch BOOLEAN, registrations_marked INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v public.tournament_checkouts%ROWTYPE;
  v_overpay BOOLEAN;
  v_marked INTEGER;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payment amount for tournament checkout %', _checkout;
  END IF;
  SELECT * INTO v FROM public.tournament_checkouts c WHERE c.id = _checkout FOR UPDATE;
  IF v.id IS NULL THEN
    RAISE EXCEPTION 'Tournament checkout % not found', _checkout;
  END IF;

  IF v.status <> 'pending' THEN
    -- Already counted: Stripe sent this payment again (or, when the session
    -- differs, a second payment arrived for a settled checkout).
    RETURN QUERY SELECT FALSE, v.payer_id, v.tournament_id, v.tournament_name, v.athlete_ids, v.amount_cents, FALSE,
      (v.stripe_checkout_session_id IS DISTINCT FROM _session), 0;
    RETURN;
  END IF;

  -- Lock this checkout's registrations, always in id order, before reading or
  -- writing them, so two payments or refunds that share a registration run
  -- one after the other (and never deadlock) instead of each acting on a
  -- stale view of the other.
  PERFORM 1 FROM public.tournament_registrations r WHERE r.id = ANY (v.registration_ids) ORDER BY r.id FOR UPDATE;

  PERFORM 1 FROM public.tournament_registrations r
  WHERE r.id = ANY (v.registration_ids) AND r.fee_cents IS NULL;
  IF FOUND THEN
    RAISE EXCEPTION 'Tournament checkout % has a registration with no locked fee', _checkout;
  END IF;

  SELECT coalesce(bool_or(r.paid_cents > 0 OR r.payment_method IS NOT NULL), FALSE) INTO v_overpay
  FROM public.tournament_registrations r
  WHERE r.id = ANY (v.registration_ids);

  UPDATE public.tournament_checkouts c SET
    status = 'paid',
    stripe_checkout_session_id = _session,
    stripe_payment_intent_id = _intent,
    net_cents = _amount,
    paid_at = now()
  WHERE c.id = v.id;

  -- A cash, check or waived mark stays as the admin set it; overpay alerts.
  UPDATE public.tournament_registrations r SET
    paid_cents = r.fee_cents,
    paid_at = now(),
    payment_method = 'card'
  WHERE r.id = ANY (v.registration_ids)
    AND (r.payment_method IS NULL OR r.payment_method = 'card');
  GET DIAGNOSTICS v_marked = ROW_COUNT;

  RETURN QUERY SELECT TRUE, v.payer_id, v.tournament_id, v.tournament_name, v.athlete_ids, v.amount_cents, v_overpay,
    FALSE, v_marked;
END;
$$;

-- _net: what the charge still holds (charge amount minus everything refunded).
-- Stripe sends the running total, so a redelivered refund changes nothing.
-- A full refund clears the card payment on the checkout's registrations; a
-- partial refund leaves them for an admin to adjust.
CREATE OR REPLACE FUNCTION public.record_tournament_refund(_intent TEXT, _net INTEGER)
RETURNS TABLE (
  found BOOLEAN, changed BOOLEAN, payer_id UUID, tournament_name TEXT, refunded_cents INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v public.tournament_checkouts%ROWTYPE;
  v_net INTEGER;
  v_delta INTEGER;
BEGIN
  IF _intent IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  SELECT * INTO v FROM public.tournament_checkouts c WHERE c.stripe_payment_intent_id = _intent FOR UPDATE;
  IF v.id IS NULL THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  v_net := GREATEST(0, coalesce(_net, 0));
  v_delta := v.net_cents - v_net;
  IF v_delta <= 0 THEN
    RETURN QUERY SELECT TRUE, FALSE, v.payer_id, v.tournament_name, 0;
    RETURN;
  END IF;

  -- Same lock, same order as record_tournament_payment: a second full refund
  -- of a shared registration waits here, then sees the first one's committed
  -- status in the NOT EXISTS check below, so the registration is cleared once
  -- no paid checkout covers it any more.
  PERFORM 1 FROM public.tournament_registrations r WHERE r.id = ANY (v.registration_ids) ORDER BY r.id FOR UPDATE;

  UPDATE public.tournament_checkouts c SET
    net_cents = v_net,
    status = CASE WHEN v_net = 0 THEN 'refunded' ELSE 'partially_refunded' END
  WHERE c.id = v.id;

  IF v_net = 0 THEN
    -- Only the card payment is undone; a cash, check or waived mark an admin
    -- added since stays, and so does a registration another card checkout
    -- still pays for (the club refunded a duplicate payment).
    UPDATE public.tournament_registrations r SET
      paid_cents = 0,
      paid_at = NULL,
      payment_method = NULL
    WHERE r.id = ANY (v.registration_ids) AND r.payment_method = 'card'
      AND NOT EXISTS (
        SELECT 1 FROM public.tournament_checkouts c2
        WHERE c2.id <> v.id AND c2.status IN ('paid', 'partially_refunded') AND r.id = ANY (c2.registration_ids)
      );
  END IF;

  RETURN QUERY SELECT TRUE, TRUE, v.payer_id, v.tournament_name, v_delta;
END;
$$;

-- Only the site's server (the Stripe webhook) applies payments and refunds.
REVOKE EXECUTE ON FUNCTION public.record_tournament_payment(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_tournament_refund(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
