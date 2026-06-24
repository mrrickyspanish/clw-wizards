CREATE TABLE public.dues_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  season TEXT NOT NULL, -- e.g. '2026-2027'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'waived', 'overdue')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_plan BOOLEAN NOT NULL DEFAULT false,
  waived_by UUID REFERENCES public.profiles(id),
  waived_at TIMESTAMPTZ,
  waived_note TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dues_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_own_dues" ON public.dues_payments
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "admin_all_dues" ON public.dues_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dues_payments_updated_at
  BEFORE UPDATE ON public.dues_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
