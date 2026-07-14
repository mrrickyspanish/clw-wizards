-- Sponsor tiers: make the corporate-sponsorship tier labels and prices editable
-- from the admin, instead of hard-coded in the page, the checkout form, and the
-- checkout API. Keyed to the existing sponsor_tier enum so it stays aligned with
-- sponsors.tier (no orphan slugs). This table is the single source of truth for
-- a tier's public label, price, and ordering.

CREATE TABLE public.sponsor_tiers (
  slug public.sponsor_tier PRIMARY KEY,
  label TEXT NOT NULL,
  -- Null price = "contact us" / custom (e.g. recognition tiers not sold online).
  price_cents INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Whether this tier is offered on the public sponsorship page + checkout form.
  public_checkout BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sponsor_tiers ENABLE ROW LEVEL SECURITY;

-- Public can read active tiers (renders the sponsorship page + checkout options).
CREATE POLICY "public_read_active_sponsor_tiers" ON public.sponsor_tiers
  FOR SELECT USING (active = true);

CREATE POLICY "admin_write_sponsor_tiers" ON public.sponsor_tiers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsor_tiers_updated_at
  BEFORE UPDATE ON public.sponsor_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the tiers currently hard-coded across the app.
INSERT INTO public.sponsor_tiers (slug, label, price_cents, sort_order, public_checkout, active) VALUES
  ('white',           'White Sponsor',     15000,  1, true,  true),
  ('black',           'Black Sponsor',     25000,  2, true,  true),
  ('yellow',          'Gold Sponsor',      50000,  3, true,  true),
  ('platinum',        'Platinum Sponsor', 100000,  4, true,  true),
  ('wizard_for_life', 'Wizard for Life',    NULL,  5, false, true);
