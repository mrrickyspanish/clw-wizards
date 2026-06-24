CREATE TYPE public.sponsor_tier AS ENUM ('platinum', 'yellow', 'black', 'white', 'wizard_for_life');

CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier public.sponsor_tier NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  amount_cents INTEGER,
  recurring BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  golf_outing_hole BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Public can read active sponsors (homepage lazy river)
CREATE POLICY "public_read_active_sponsors" ON public.sponsors
  FOR SELECT USING (active = true);

CREATE POLICY "admin_write_sponsors" ON public.sponsors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
