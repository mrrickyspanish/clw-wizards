-- ============================================================================
-- CLW Platform — full database schema (single-file, dashboard-paste version)
-- ============================================================================
-- This is the FINAL state of the database, flattened from the incremental
-- migrations in supabase/migrations/ into one script you can paste straight
-- into the Supabase SQL Editor and run once on a fresh project.
--
-- Why a separate file: the migration files are written to run one at a time
-- (the way `supabase db push` runs them). One of them adds a value to an enum
-- and uses it later, which Postgres won't allow inside a single transaction —
-- so pasting all the migrations together would fail. This file avoids that by
-- creating everything in its final shape, in dependency order.
--
-- Safe to run on a brand-new project. Running it twice will error on the
-- already-existing objects (by design — it's a one-time setup script).
-- ============================================================================

-- Extensions ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums ---------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'parent', 'staff');
CREATE TYPE public.sponsor_tier AS ENUM ('platinum', 'yellow', 'black', 'white', 'wizard_for_life');
CREATE TYPE public.comm_channel AS ENUM ('email', 'sms');
CREATE TYPE public.comm_type AS ENUM (
  'tournament_reminder_wednesday',
  'tournament_reminder_weigh_in',
  'dues_reminder',
  'open_tournaments_digest',
  'general_blast',
  'registration_confirmation',
  'welcome'
);

-- Generic updated_at trigger function ---------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles (one row per auth user) ------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role public.app_role NOT NULL DEFAULT 'parent',
  phone TEXT,
  practice_group TEXT,
  sms_opt_in BOOLEAN NOT NULL DEFAULT false,
  sms_opt_in_at TIMESTAMPTZ,
  consent_text TEXT,
  email_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- athletes ------------------------------------------------------------------
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

-- tournaments ---------------------------------------------------------------
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'IL',
  external_registration_url TEXT,
  external_platform TEXT CHECK (external_platform IN ('trackwrestling', 'flowrestling', 'internal', 'other')),
  weigh_in_time TEXT,
  weigh_in_date DATE,
  start_time TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  practice_groups TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- tournament_registrations --------------------------------------------------
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'no_show')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (tournament_id, athlete_id)
);
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- dues_payments -------------------------------------------------------------
CREATE TABLE public.dues_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  season TEXT NOT NULL,
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

-- sponsors ------------------------------------------------------------------
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

-- communication_log ---------------------------------------------------------
CREATE TABLE public.communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel public.comm_channel NOT NULL,
  comm_type public.comm_type NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT
);
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

-- athlete_documents ---------------------------------------------------------
CREATE TABLE public.athlete_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('birth_certificate', 'usa_wrestling_card', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.athlete_documents ENABLE ROW LEVEL SECURITY;

-- donations -----------------------------------------------------------------
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

-- ============================================================================
-- Functions that depend on the tables above
-- ============================================================================

-- Role check used by every RLS policy. SECURITY DEFINER so it bypasses RLS on
-- profiles — this is what prevents the policies that call it from recursing.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role);
$$;

-- Auto-create a profile row on signup, defaulting new users to 'parent'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'parent', true);
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dues_payments_updated_at BEFORE UPDATE ON public.dues_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Row-level security policies
-- ============================================================================

-- profiles
CREATE POLICY "Profiles are viewable by self" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile (parent only)" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'parent' AND is_active = true);

-- athletes
CREATE POLICY "parents_own_athletes" ON public.athletes
  FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "admin_staff_all_athletes" ON public.athletes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- tournaments
CREATE POLICY "public_read_tournaments" ON public.tournaments
  FOR SELECT USING (true);
CREATE POLICY "admin_write_tournaments" ON public.tournaments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- tournament_registrations
CREATE POLICY "parents_own_registrations" ON public.tournament_registrations
  FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "admin_staff_all_registrations" ON public.tournament_registrations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "admin_write_registrations" ON public.tournament_registrations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_registrations" ON public.tournament_registrations
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_registrations" ON public.tournament_registrations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- dues_payments
CREATE POLICY "parents_own_dues" ON public.dues_payments
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "admin_all_dues" ON public.dues_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- sponsors
CREATE POLICY "public_read_active_sponsors" ON public.sponsors
  FOR SELECT USING (active = true);
CREATE POLICY "admin_write_sponsors" ON public.sponsors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- communication_log (writes are service-role only, by design)
CREATE POLICY "admin_read_comm_log" ON public.communication_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- athlete_documents
CREATE POLICY "parents_own_athlete_docs" ON public.athlete_documents
  FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "admin_staff_all_athlete_docs" ON public.athlete_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "admin_write_athlete_docs" ON public.athlete_documents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- donations (writes are service-role only, by design)
CREATE POLICY "admin_read_donations" ON public.donations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Storage: private bucket for athlete documents (birth certs, USAW cards)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-documents', 'athlete-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "parents_upload_own_athlete_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-documents' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "parents_read_own_athlete_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'athlete-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'staff')
    )
  );
CREATE POLICY "admin_delete_athlete_docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'athlete-documents' AND public.has_role(auth.uid(), 'admin')
  );
