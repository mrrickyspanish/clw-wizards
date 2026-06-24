CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  weight_class TEXT,
  practice_group TEXT NOT NULL,
  usa_wrestling_card_number TEXT,
  shirt_size TEXT,
  birth_certificate_url TEXT,
  usa_wrestling_card_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- profiles.id IS auth.uid() in this schema, so the parent_id check is direct —
-- no subquery against profiles needed (the brief's draft assumed a separate
-- profiles.user_id column that doesn't exist here).
CREATE POLICY "parents_own_athletes" ON public.athletes
  FOR ALL USING (parent_id = auth.uid());

-- Staff visibility is further narrowed to their assigned practice_group in the
-- app layer (the brief's spec) since RLS alone can't express "staff's assigned
-- group" without a staff->group mapping table, which is out of scope for now.
CREATE POLICY "admin_staff_all_athletes" ON public.athletes
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
