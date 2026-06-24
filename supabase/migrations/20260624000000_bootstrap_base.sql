-- Bootstrap baseline for a STANDALONE CLW Supabase project.
--
-- Migrations 0001–0010 were authored as an incremental layer on top of the
-- existing "driver-hub" database, so they assume these objects already exist:
--   * the `app_role` enum (with values 'admin','driver')
--   * the `profiles` table (id = auth.users.id)
--   * helper functions `has_role()` and `update_updated_at_column()`
--   * `handle_new_user()` + the `on_auth_user_created` trigger
--   * base profiles RLS policies (incl. the "(driver only)" insert policy)
--
-- A fresh project has none of these, so `supabase db push` would fail on the
-- first migration. This file recreates that baseline EXACTLY as the later
-- migrations expect it (e.g. the enum starts as 'admin','driver' so migration
-- 0001's `RENAME VALUE 'driver' TO 'parent'` still applies), letting 0001–0010
-- run unchanged and land in the correct final state.

-- gen_random_uuid() is in core Postgres 13+, but ensure pgcrypto for parity.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Role enum — intentionally the pre-rename driver-hub shape.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'driver');
  END IF;
END
$$;

-- Generic updated_at trigger function.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Profiles table — base columns only. Migration 0001 adds email,
-- practice_group, sms_* and email_unsubscribe_token on top of this.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.app_role NOT NULL DEFAULT 'driver',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Role check used by every later RLS policy. SECURITY DEFINER so it bypasses
-- RLS on profiles (the function owner owns the table) — this is what prevents
-- the policies that call it from recursing.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by self" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin-only here: 'staff' is not a valid app_role value until migration 0001
-- adds it, and Postgres validates enum literals at CREATE POLICY time — so
-- referencing 'staff' in this baseline would abort the bootstrap. This mirrors
-- driver-hub's actual pre-state (admin/driver only). If staff ever need to read
-- parent profiles via the authenticated client, add that policy in a numbered
-- migration after 0001 (where 'staff' exists); today staff read the domain
-- tables (athletes, registrations) directly and comms reads via service role.
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migration 0009 drops this exact policy name and recreates a "(parent only)"
-- version after the enum rename — so it must exist here first.
CREATE POLICY "Users can insert own profile (driver only)" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id AND role = 'driver' AND is_active = true
  );

-- Signup trigger. Migration 0009 replaces this function body to default new
-- users to 'parent' and populate email; the trigger itself is created here.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'driver', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
