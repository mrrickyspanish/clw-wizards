-- ============================================================================
-- CLW Platform -- full database schema (single-file, dashboard-paste version)
-- ============================================================================
-- This is the FINAL state of the database, generated from the incremental
-- migrations in supabase/migrations/ (replayed against a real Postgres 16
-- instance, then reorganized from the resulting catalog -- not hand-typed) so
-- you can paste it straight into the Supabase SQL Editor and run once on a
-- fresh project.
--
-- Why a separate file: the migration files are written to run one at a time
-- (the way `supabase db push` runs them). Several add a value to an enum and
-- use it later, which Postgres won't allow inside a single transaction -- so
-- pasting all the migrations together would fail. This file avoids that by
-- creating everything in its final shape, in dependency order.
--
-- Safe to run on a brand-new project. Running it twice will error on the
-- already-existing objects (by design -- it's a one-time setup script).
--
-- This file must be regenerated (not hand-edited) whenever a migration is
-- added -- see the note at the end of this file.
-- ============================================================================

-- Extensions ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enums -----------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'parent',
    'staff'
);
CREATE TYPE public.comm_channel AS ENUM (
    'email',
    'sms'
);
CREATE TYPE public.comm_type AS ENUM (
    'tournament_reminder_wednesday',
    'tournament_reminder_weigh_in',
    'dues_reminder',
    'open_tournaments_digest',
    'general_blast',
    'registration_confirmation',
    'welcome'
);
CREATE TYPE public.sponsor_tier AS ENUM (
    'platinum',
    'yellow',
    'black',
    'white',
    'wizard_for_life'
);

-- Generic updated_at trigger, used by nearly every table below. Table-
-- independent (plpgsql bodies are compiled lazily at first call, not
-- validated at CREATE time), so it can come before the tables that use it.
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- Identity ------------------------------------------------------------------
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role public.app_role DEFAULT 'parent'::public.app_role NOT NULL,
    phone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    practice_group text,
    sms_opt_in boolean DEFAULT false NOT NULL,
    sms_opt_in_at timestamp with time zone,
    consent_text text,
    email_unsubscribe_token uuid DEFAULT gen_random_uuid() NOT NULL,
    onboarding_completed_at timestamp with time zone,
    admin_scope text,
    street_address text,
    city text,
    state text,
    postal_code text,
    CONSTRAINT profiles_admin_scope_check CHECK ((admin_scope = ANY (ARRAY['full'::text, 'limited'::text])))
);

-- Athletes & family ---------------------------------------------------------
CREATE TABLE public.athletes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date NOT NULL,
    weight_class text,
    practice_group text NOT NULL,
    usa_wrestling_card_number text,
    shirt_size text,
    birth_certificate_url text,
    usa_wrestling_card_url text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referral_source text
);
CREATE TABLE public.athlete_guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    ordinal smallint NOT NULL,
    name text NOT NULL,
    relationship text,
    phone text,
    email text,
    coach_interest text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT athlete_guardians_ordinal_check CHECK ((ordinal = ANY (ARRAY[1, 2])))
);
CREATE TABLE public.athlete_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    athlete_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    doc_type text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT athlete_documents_doc_type_check CHECK ((doc_type = ANY (ARRAY['birth_certificate'::text, 'usa_wrestling_card'::text, 'other'::text])))
);
CREATE TABLE public.family_guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT family_guardians_check CHECK ((owner_id <> guardian_id))
);
CREATE TABLE public.family_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    inviter_id uuid NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    redeemed_by uuid,
    redeemed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Season registration & disclosures -----------------------------------------
CREATE TABLE public.club_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    event_type text DEFAULT 'event'::text NOT NULL,
    date date NOT NULL,
    start_time text,
    end_time text,
    location text,
    notes text,
    practice_group text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT club_events_event_type_check CHECK ((event_type = ANY (ARRAY['event'::text, 'banquet'::text, 'parent_night'::text, 'fundraiser'::text, 'meeting'::text, 'season_registration'::text, 'other'::text])))
);
CREATE TABLE public.season_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    season_label text NOT NULL,
    registration_open_date date NOT NULL,
    registration_close_date date NOT NULL,
    dues_amount_cents integer DEFAULT 0 NOT NULL,
    dues_due_date date,
    instructions text,
    require_usa_card boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT season_registrations_check CHECK ((registration_close_date >= registration_open_date)),
    CONSTRAINT season_registrations_dues_amount_cents_check CHECK ((dues_amount_cents >= 0))
);
CREATE TABLE public.season_price_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    season_registration_id uuid NOT NULL,
    label text NOT NULL,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    amount_cents integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT season_price_tiers_amount_cents_check CHECK ((amount_cents >= 0)),
    CONSTRAINT season_price_tiers_check CHECK ((ends_on >= starts_on))
);
CREATE TABLE public.season_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    season_registration_id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    dues_payment_id uuid,
    status text DEFAULT 'submitted'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    admin_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    usa_card_document_id uuid,
    grade text,
    school text,
    weight_lbs numeric(5,1),
    shirt_size text,
    years_experience text,
    season_commitment text,
    CONSTRAINT season_enrollments_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'changes_requested'::text, 'approved'::text, 'withdrawn'::text]))),
    CONSTRAINT season_enrollments_weight_lbs_check CHECK (((weight_lbs IS NULL) OR (weight_lbs > (0)::numeric)))
);
CREATE TABLE public.disclosures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    agreement_label text NOT NULL,
    version integer NOT NULL,
    required boolean DEFAULT true NOT NULL,
    requires_signature boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT disclosures_version_check CHECK ((version > 0))
);
CREATE TABLE public.disclosure_acceptances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    disclosure_id uuid NOT NULL,
    season_registration_id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    accepted_by uuid NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    typed_signature text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Dues ----------------------------------------------------------------------
CREATE TABLE public.dues_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid NOT NULL,
    athlete_id uuid,
    amount_cents integer NOT NULL,
    amount_paid_cents integer DEFAULT 0 NOT NULL,
    season text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    stripe_payment_intent_id text,
    stripe_checkout_session_id text,
    payment_plan boolean DEFAULT false NOT NULL,
    waived_by uuid,
    waived_at timestamp with time zone,
    waived_note text,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dues_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'partial'::text, 'paid'::text, 'waived'::text, 'overdue'::text])))
);

-- Communications ------------------------------------------------------------
CREATE TABLE public.communication_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel public.comm_channel NOT NULL,
    comm_type public.comm_type NOT NULL,
    recipient_id uuid,
    recipient_email text,
    recipient_phone text,
    tournament_id uuid,
    subject text,
    body_preview text,
    status text DEFAULT 'sent'::text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    external_id text,
    CONSTRAINT communication_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'bounced'::text])))
);

-- Public content & marketing ------------------------------------------------
CREATE TABLE public.page_content (
    key text NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.faq_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.coaches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    role text DEFAULT ''::text NOT NULL,
    section text NOT NULL,
    practice_group text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coaches_section_check CHECK ((section = ANY (ARRAY['board'::text, 'practice'::text])))
);

-- Sponsors & donations ------------------------------------------------------
CREATE TABLE public.sponsor_tiers (
    slug public.sponsor_tier NOT NULL,
    label text NOT NULL,
    price_cents integer,
    sort_order integer DEFAULT 0 NOT NULL,
    public_checkout boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.sponsors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    tier public.sponsor_tier NOT NULL,
    logo_url text,
    website_url text,
    contact_name text,
    contact_email text,
    amount_cents integer,
    recurring boolean DEFAULT false NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    active boolean DEFAULT true NOT NULL,
    golf_outing_hole boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    logo_dark_backdrop boolean DEFAULT false NOT NULL,
    industry text,
    description text,
    CONSTRAINT sponsor_description_is_one_line CHECK (((description IS NULL) OR ((length(btrim(description)) >= 1) AND (length(btrim(description)) <= 200)))),
    CONSTRAINT sponsor_industry_is_a_label CHECK (((industry IS NULL) OR ((length(btrim(industry)) >= 1) AND (length(btrim(industry)) <= 60))))
);
CREATE TABLE public.donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    donor_name text,
    donor_email text,
    amount_cents integer NOT NULL,
    recurring boolean DEFAULT false NOT NULL,
    stripe_checkout_session_id text,
    stripe_payment_intent_id text,
    stripe_customer_id text,
    stripe_subscription_id text,
    thank_you_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tournaments ---------------------------------------------------------------
CREATE TABLE public.tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    location text NOT NULL,
    city text NOT NULL,
    state text DEFAULT 'IL'::text NOT NULL,
    external_registration_url text,
    external_platform text,
    weigh_in_time text,
    weigh_in_date date,
    start_time text,
    status text DEFAULT 'open'::text NOT NULL,
    practice_groups text[] DEFAULT '{}'::text[] NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    competition_level text,
    image_url text,
    weigh_in_location text,
    CONSTRAINT tournaments_external_platform_check CHECK ((external_platform = ANY (ARRAY['trackwrestling'::text, 'flowrestling'::text, 'internal'::text, 'other'::text]))),
    CONSTRAINT tournaments_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'cancelled'::text])))
);
CREATE TABLE public.tournament_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    status text DEFAULT 'registered'::text NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone,
    notes text,
    CONSTRAINT tournament_registrations_status_check CHECK ((status = ANY (ARRAY['registered'::text, 'confirmed'::text, 'withdrawn'::text, 'no_show'::text])))
);

-- Practices -----------------------------------------------------------------
CREATE TABLE public.practices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    practice_group text NOT NULL,
    weekday smallint NOT NULL,
    start_time text NOT NULL,
    end_time text,
    location text NOT NULL,
    notes text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT practices_weekday_check CHECK (((weekday >= 0) AND (weekday <= 6)))
);
CREATE TABLE public.practice_cancellations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    practice_id uuid NOT NULL,
    date date NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Admin ---------------------------------------------------------------------
CREATE TABLE public.admin_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    scope text NOT NULL,
    inviter_id uuid,
    expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    redeemed_by uuid,
    redeemed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_invites_scope_check CHECK ((scope = ANY (ARRAY['full'::text, 'limited'::text])))
);

-- ============================================================================
-- Functions
-- ============================================================================
-- Everything below is LANGUAGE sql except handle_new_user and the two
-- season_enrollment functions (plpgsql). Postgres validates a LANGUAGE sql
-- body against the live catalog at CREATE time -- unlike plpgsql, whose body
-- is only compiled at first call -- so these must come after the tables
-- above, and guards_athlete (which calls guards_owner) after guards_owner.
-- Confirmed by running this file against a genuinely empty database: get the
-- order wrong and CREATE FUNCTION itself fails, not just a later call.
CREATE FUNCTION public.guards_owner(_owner uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT _owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_guardians g
      WHERE g.owner_id = _owner AND g.guardian_id = auth.uid()
    );
$$;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  );
$$;
CREATE FUNCTION public.is_full_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin' AND admin_scope = 'full'
  );
$$;
CREATE FUNCTION public.guards_athlete(_athlete uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id = _athlete AND public.guards_owner(a.parent_id)
  );
$$;
CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'parent', true);
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.submit_season_enrollment(_season_registration_id uuid, _athlete_id uuid, _grade text DEFAULT NULL::text, _school text DEFAULT NULL::text, _weight_lbs numeric DEFAULT NULL::numeric, _shirt_size text DEFAULT NULL::text, _years_experience text DEFAULT NULL::text, _season_commitment text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _caller UUID := auth.uid();
  _owner UUID;
  _season public.season_registrations%ROWTYPE;
  _event public.club_events%ROWTYPE;
  _enrollment_id UUID;
  _dues_id UUID;
  _card_id UUID;
  _amount_cents INTEGER;
  _unsigned TEXT;
  _existing_status TEXT;
  _today DATE := (NOW() AT TIME ZONE 'America/Chicago')::DATE;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  SELECT * INTO _season
  FROM public.season_registrations
  WHERE id = _season_registration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season registration not found';
  END IF;
  SELECT * INTO _event
  FROM public.club_events
  WHERE id = _season.event_id;
  IF NOT FOUND OR NOT _event.active THEN
    RAISE EXCEPTION 'Season registration is not active';
  END IF;
  IF _today < _season.registration_open_date THEN
    RAISE EXCEPTION 'Season registration has not opened yet';
  END IF;
  IF _today > _season.registration_close_date THEN
    RAISE EXCEPTION 'Season registration is closed';
  END IF;
  SELECT parent_id INTO _owner
  FROM public.athletes
  WHERE id = _athlete_id;
  IF _owner IS NULL OR NOT public.guards_athlete(_athlete_id) THEN
    RAISE EXCEPTION 'That wrestler is not on your family roster';
  END IF;
  SELECT d.title INTO _unsigned
  FROM public.disclosures d
  WHERE d.active
    AND d.required
    AND NOT EXISTS (
      SELECT 1
      FROM public.disclosure_acceptances a
      WHERE a.disclosure_id = d.id
        AND a.season_registration_id = _season_registration_id
        AND a.athlete_id = _athlete_id
    )
  ORDER BY d.title
  LIMIT 1;
  IF _unsigned IS NOT NULL THEN
    RAISE EXCEPTION 'Sign the % before registering this wrestler', _unsigned;
  END IF;
  IF _season.require_usa_card THEN
    -- Prefer a verified card, then the most recent upload. A returning family
    -- reuses the verified one; a replacement upload supersedes it because the
    -- documents flow deletes the row it replaces.
    SELECT id INTO _card_id
    FROM public.athlete_documents
    WHERE athlete_id = _athlete_id
      AND doc_type = 'usa_wrestling_card'
    ORDER BY verified DESC, uploaded_at DESC
    LIMIT 1;
    IF _card_id IS NULL THEN
      RAISE EXCEPTION 'Upload a USA Wrestling card before registering';
    END IF;
  END IF;
  SELECT id, status, dues_payment_id
  INTO _enrollment_id, _existing_status, _dues_id
  FROM public.season_enrollments
  WHERE season_registration_id = _season_registration_id
    AND athlete_id = _athlete_id
  FOR UPDATE;
  IF _existing_status = 'approved' THEN
    RAISE EXCEPTION 'This wrestler is already approved for the season';
  END IF;
  IF _enrollment_id IS NULL THEN
    INSERT INTO public.season_enrollments (
      season_registration_id,
      athlete_id,
      parent_id,
      dues_payment_id,
      usa_card_document_id,
      status,
      submitted_at,
      reviewed_by,
      reviewed_at,
      admin_note,
      grade,
      school,
      weight_lbs,
      shirt_size,
      years_experience,
      season_commitment
    )
    VALUES (
      _season_registration_id,
      _athlete_id,
      _owner,
      NULL,
      _card_id,
      'submitted',
      NOW(),
      NULL,
      NULL,
      NULL,
      _grade,
      _school,
      _weight_lbs,
      _shirt_size,
      _years_experience,
      _season_commitment
    )
    RETURNING id, dues_payment_id INTO _enrollment_id, _dues_id;
  ELSE
    -- COALESCE so a caller that omits an answer leaves the stored one alone
    -- rather than blanking it.
    UPDATE public.season_enrollments
    SET
      parent_id = _owner,
      usa_card_document_id = _card_id,
      status = 'submitted',
      submitted_at = NOW(),
      reviewed_by = NULL,
      reviewed_at = NULL,
      admin_note = NULL,
      grade = COALESCE(_grade, grade),
      school = COALESCE(_school, school),
      weight_lbs = COALESCE(_weight_lbs, weight_lbs),
      shirt_size = COALESCE(_shirt_size, shirt_size),
      years_experience = COALESCE(_years_experience, years_experience),
      season_commitment = COALESCE(_season_commitment, season_commitment)
    WHERE id = _enrollment_id;
  END IF;
  IF _dues_id IS NULL THEN
    -- A season with no tiers configured prices at its flat dues_amount_cents,
    -- which is also what happens after the last tier's end date.
    SELECT amount_cents INTO _amount_cents
    FROM public.season_price_tiers
    WHERE season_registration_id = _season_registration_id
      AND _today >= starts_on
      AND _today <= ends_on
    LIMIT 1;
    IF _amount_cents IS NULL THEN
      _amount_cents := _season.dues_amount_cents;
    END IF;
    INSERT INTO public.dues_payments (
      parent_id,
      athlete_id,
      amount_cents,
      amount_paid_cents,
      season,
      status,
      due_date
    )
    VALUES (
      _owner,
      _athlete_id,
      _amount_cents,
      0,
      _season.season_label,
      CASE WHEN _amount_cents = 0 THEN 'paid' ELSE 'pending' END,
      _season.dues_due_date
    )
    RETURNING id INTO _dues_id;
    UPDATE public.season_enrollments
    SET dues_payment_id = _dues_id
    WHERE id = _enrollment_id;
  END IF;
  RETURN _enrollment_id;
END;
$$;
CREATE FUNCTION public.withdraw_season_enrollment(_enrollment_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _athlete_id UUID;
  _status TEXT;
BEGIN
  SELECT athlete_id, status INTO _athlete_id, _status
  FROM public.season_enrollments
  WHERE id = _enrollment_id
  FOR UPDATE;
  IF _athlete_id IS NULL OR NOT public.guards_athlete(_athlete_id) THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  IF _status = 'approved' THEN
    RAISE EXCEPTION 'Contact the club to withdraw an approved registration';
  END IF;
  UPDATE public.season_enrollments
  SET status = 'withdrawn', submitted_at = NOW()
  WHERE id = _enrollment_id;
END;
$$;

-- ============================================================================
-- Constraints, indexes, triggers
-- ============================================================================

-- Identity ------------------------------------------------------------------
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Athletes & family ---------------------------------------------------------
ALTER TABLE ONLY public.athletes
    ADD CONSTRAINT athletes_pkey PRIMARY KEY (id);
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.athlete_guardians
    ADD CONSTRAINT athlete_guardians_athlete_id_ordinal_key UNIQUE (athlete_id, ordinal);
ALTER TABLE ONLY public.athlete_guardians
    ADD CONSTRAINT athlete_guardians_pkey PRIMARY KEY (id);
CREATE INDEX athlete_guardians_athlete_idx ON public.athlete_guardians USING btree (athlete_id);
CREATE TRIGGER update_athlete_guardians_updated_at BEFORE UPDATE ON public.athlete_guardians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.athlete_documents
    ADD CONSTRAINT athlete_documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.family_guardians
    ADD CONSTRAINT family_guardians_owner_id_guardian_id_key UNIQUE (owner_id, guardian_id);
ALTER TABLE ONLY public.family_guardians
    ADD CONSTRAINT family_guardians_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_code_key UNIQUE (code);
ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_pkey PRIMARY KEY (id);

-- Season registration & disclosures -----------------------------------------
ALTER TABLE ONLY public.club_events
    ADD CONSTRAINT club_events_pkey PRIMARY KEY (id);
CREATE TRIGGER update_club_events_updated_at BEFORE UPDATE ON public.club_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.season_registrations
    ADD CONSTRAINT season_registrations_event_id_key UNIQUE (event_id);
ALTER TABLE ONLY public.season_registrations
    ADD CONSTRAINT season_registrations_pkey PRIMARY KEY (id);
CREATE TRIGGER update_season_registrations_updated_at BEFORE UPDATE ON public.season_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.season_price_tiers
    ADD CONSTRAINT season_price_tiers_no_overlap EXCLUDE USING gist (season_registration_id WITH =, daterange(starts_on, ends_on, '[]'::text) WITH &&);
ALTER TABLE ONLY public.season_price_tiers
    ADD CONSTRAINT season_price_tiers_pkey PRIMARY KEY (id);
CREATE INDEX season_price_tiers_season_idx ON public.season_price_tiers USING btree (season_registration_id, starts_on);
CREATE TRIGGER update_season_price_tiers_updated_at BEFORE UPDATE ON public.season_price_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_dues_payment_id_key UNIQUE (dues_payment_id);
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_season_registration_id_athlete_id_key UNIQUE (season_registration_id, athlete_id);
CREATE INDEX season_enrollments_card_idx ON public.season_enrollments USING btree (usa_card_document_id);
CREATE INDEX season_enrollments_parent_idx ON public.season_enrollments USING btree (parent_id);
CREATE INDEX season_enrollments_status_idx ON public.season_enrollments USING btree (status);
CREATE TRIGGER update_season_enrollments_updated_at BEFORE UPDATE ON public.season_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.disclosures
    ADD CONSTRAINT disclosures_slug_version_key UNIQUE (slug, version);
CREATE UNIQUE INDEX disclosures_one_active_per_slug ON public.disclosures USING btree (slug) WHERE active;
CREATE TRIGGER update_disclosures_updated_at BEFORE UPDATE ON public.disclosures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_disclosure_id_season_registration_id_key UNIQUE (disclosure_id, season_registration_id, athlete_id);
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_pkey PRIMARY KEY (id);
CREATE INDEX disclosure_acceptances_season_athlete_idx ON public.disclosure_acceptances USING btree (season_registration_id, athlete_id);

-- Dues ----------------------------------------------------------------------
ALTER TABLE ONLY public.dues_payments
    ADD CONSTRAINT dues_payments_pkey PRIMARY KEY (id);
CREATE TRIGGER update_dues_payments_updated_at BEFORE UPDATE ON public.dues_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Communications ------------------------------------------------------------
ALTER TABLE ONLY public.communication_log
    ADD CONSTRAINT communication_log_pkey PRIMARY KEY (id);

-- Public content & marketing ------------------------------------------------
ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (key);
CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.faq_items
    ADD CONSTRAINT faq_items_pkey PRIMARY KEY (id);
CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON public.faq_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_pkey PRIMARY KEY (id);
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sponsors & donations ------------------------------------------------------
ALTER TABLE ONLY public.sponsor_tiers
    ADD CONSTRAINT sponsor_tiers_pkey PRIMARY KEY (slug);
CREATE TRIGGER update_sponsor_tiers_updated_at BEFORE UPDATE ON public.sponsor_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_pkey PRIMARY KEY (id);
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);

-- Tournaments ---------------------------------------------------------------
ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_tournament_id_athlete_id_key UNIQUE (tournament_id, athlete_id);

-- Practices -----------------------------------------------------------------
ALTER TABLE ONLY public.practices
    ADD CONSTRAINT practices_pkey PRIMARY KEY (id);
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON public.practices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.practice_cancellations
    ADD CONSTRAINT practice_cancellations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.practice_cancellations
    ADD CONSTRAINT practice_cancellations_practice_id_date_key UNIQUE (practice_id, date);

-- Admin ---------------------------------------------------------------------
ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_code_key UNIQUE (code);
ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_pkey PRIMARY KEY (id);

-- ============================================================================
-- Foreign keys
-- ============================================================================
-- Kept as a separate block, same as pg_dump's own ordering: every table above
-- already exists by this point, so cross-table references resolve regardless
-- of which table was created first.
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.athletes
    ADD CONSTRAINT athletes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.athlete_guardians
    ADD CONSTRAINT athlete_guardians_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.athlete_documents
    ADD CONSTRAINT athlete_documents_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.athlete_documents
    ADD CONSTRAINT athlete_documents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.athlete_documents
    ADD CONSTRAINT athlete_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.family_guardians
    ADD CONSTRAINT family_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.family_guardians
    ADD CONSTRAINT family_guardians_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.season_registrations
    ADD CONSTRAINT season_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.club_events(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.season_price_tiers
    ADD CONSTRAINT season_price_tiers_season_registration_id_fkey FOREIGN KEY (season_registration_id) REFERENCES public.season_registrations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_dues_payment_id_fkey FOREIGN KEY (dues_payment_id) REFERENCES public.dues_payments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_season_registration_id_fkey FOREIGN KEY (season_registration_id) REFERENCES public.season_registrations(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.season_enrollments
    ADD CONSTRAINT season_enrollments_usa_card_document_id_fkey FOREIGN KEY (usa_card_document_id) REFERENCES public.athlete_documents(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_disclosure_id_fkey FOREIGN KEY (disclosure_id) REFERENCES public.disclosures(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.disclosure_acceptances
    ADD CONSTRAINT disclosure_acceptances_season_registration_id_fkey FOREIGN KEY (season_registration_id) REFERENCES public.season_registrations(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.dues_payments
    ADD CONSTRAINT dues_payments_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.dues_payments
    ADD CONSTRAINT dues_payments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.dues_payments
    ADD CONSTRAINT dues_payments_waived_by_fkey FOREIGN KEY (waived_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.communication_log
    ADD CONSTRAINT communication_log_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.communication_log
    ADD CONSTRAINT communication_log_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.practice_cancellations
    ADD CONSTRAINT practice_cancellations_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.practices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.admin_invites
    ADD CONSTRAINT admin_invites_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Identity ------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage all profiles" ON public.profiles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Profiles are viewable by self" ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Users can insert own profile (parent only)" ON public.profiles FOR INSERT WITH CHECK (((auth.uid() = id) AND (role = 'parent'::public.app_role) AND (is_active = true)));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

-- Athletes & family ---------------------------------------------------------
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_staff_all_athletes ON public.athletes FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));
CREATE POLICY athletes_guardian_read ON public.athletes FOR SELECT USING (public.guards_owner(parent_id));
CREATE POLICY athletes_guardian_update ON public.athletes FOR UPDATE USING (public.guards_owner(parent_id));
CREATE POLICY parents_own_athletes ON public.athletes USING ((parent_id = auth.uid()));
ALTER TABLE public.athlete_guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_athlete_guardians ON public.athlete_guardians TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY family_manage_athlete_guardians ON public.athlete_guardians TO authenticated USING (public.guards_athlete(athlete_id)) WITH CHECK (public.guards_athlete(athlete_id));
CREATE POLICY staff_read_athlete_guardians ON public.athlete_guardians FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));
ALTER TABLE public.athlete_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_staff_all_athlete_docs ON public.athlete_documents FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));
CREATE POLICY admin_write_athlete_docs ON public.athlete_documents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY adoc_guardian_insert ON public.athlete_documents FOR INSERT WITH CHECK (public.guards_athlete(athlete_id));
CREATE POLICY adoc_guardian_read ON public.athlete_documents FOR SELECT USING (public.guards_athlete(athlete_id));
CREATE POLICY parents_own_athlete_docs ON public.athlete_documents USING ((parent_id = auth.uid()));
ALTER TABLE public.family_guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_guardians_admin_read ON public.family_guardians FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));
CREATE POLICY family_guardians_guardian_leave ON public.family_guardians FOR DELETE USING ((guardian_id = auth.uid()));
CREATE POLICY family_guardians_guardian_read ON public.family_guardians FOR SELECT USING ((guardian_id = auth.uid()));
CREATE POLICY family_guardians_owner_all ON public.family_guardians USING ((owner_id = auth.uid()));
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_invites_owner_all ON public.family_invites USING ((inviter_id = auth.uid()));

-- Season registration & disclosures -----------------------------------------
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_club_events ON public.club_events USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_club_events ON public.club_events FOR SELECT USING (true);
ALTER TABLE public.season_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_season_registrations ON public.season_registrations TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_season_registrations ON public.season_registrations FOR SELECT USING (true);
ALTER TABLE public.season_price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_season_price_tiers ON public.season_price_tiers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_season_price_tiers ON public.season_price_tiers FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.season_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_season_enrollments ON public.season_enrollments TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY family_read_season_enrollments ON public.season_enrollments FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.guards_athlete(athlete_id)));
ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_disclosures ON public.disclosures TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_active_disclosures ON public.disclosures FOR SELECT TO anon, authenticated USING (active);
ALTER TABLE public.disclosure_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_manage_disclosure_acceptances ON public.disclosure_acceptances TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY family_read_disclosure_acceptances ON public.disclosure_acceptances FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role) OR public.guards_athlete(athlete_id)));
CREATE POLICY family_sign_disclosure_acceptances ON public.disclosure_acceptances FOR INSERT TO authenticated WITH CHECK ((public.guards_athlete(athlete_id) AND (accepted_by = auth.uid())));

-- Dues ----------------------------------------------------------------------
ALTER TABLE public.dues_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_dues ON public.dues_payments USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY dues_guardian_owner_read ON public.dues_payments FOR SELECT USING (public.guards_owner(parent_id));
CREATE POLICY dues_guardian_read ON public.dues_payments FOR SELECT USING (((athlete_id IS NOT NULL) AND public.guards_athlete(athlete_id)));
CREATE POLICY parents_own_dues ON public.dues_payments FOR SELECT USING ((parent_id = auth.uid()));

-- Communications ------------------------------------------------------------
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read_comm_log ON public.communication_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public content & marketing ------------------------------------------------
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY full_admin_write_page_content ON public.page_content USING (public.is_full_admin(auth.uid())) WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY public_read_page_content ON public.page_content FOR SELECT USING (true);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY full_admin_write_faq ON public.faq_items USING (public.is_full_admin(auth.uid())) WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY public_read_active_faq ON public.faq_items FOR SELECT USING ((active = true));
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY full_admin_write_coaches ON public.coaches USING (public.is_full_admin(auth.uid())) WITH CHECK (public.is_full_admin(auth.uid()));
CREATE POLICY public_read_active_coaches ON public.coaches FOR SELECT USING ((active = true));

-- Sponsors & donations ------------------------------------------------------
ALTER TABLE public.sponsor_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_sponsor_tiers ON public.sponsor_tiers USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_active_sponsor_tiers ON public.sponsor_tiers FOR SELECT USING ((active = true));
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_sponsors ON public.sponsors USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_active_sponsors ON public.sponsors FOR SELECT USING ((active = true));
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read_donations ON public.donations FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tournaments ---------------------------------------------------------------
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_tournaments ON public.tournaments USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_tournaments ON public.tournaments FOR SELECT USING (true);
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_delete_registrations ON public.tournament_registrations FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY admin_staff_all_registrations ON public.tournament_registrations FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'staff'::public.app_role)));
CREATE POLICY admin_update_registrations ON public.tournament_registrations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY admin_write_registrations ON public.tournament_registrations FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY parents_own_registrations ON public.tournament_registrations USING ((parent_id = auth.uid()));
CREATE POLICY treg_guardian_all ON public.tournament_registrations USING (public.guards_athlete(athlete_id)) WITH CHECK (public.guards_athlete(athlete_id));

-- Practices -----------------------------------------------------------------
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_practices ON public.practices USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_practices ON public.practices FOR SELECT USING (true);
ALTER TABLE public.practice_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_write_practice_cancellations ON public.practice_cancellations USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY public_read_practice_cancellations ON public.practice_cancellations FOR SELECT USING (true);

-- Admin ---------------------------------------------------------------------
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY full_admin_manage_admin_invites ON public.admin_invites USING (public.is_full_admin(auth.uid())) WITH CHECK (public.is_full_admin(auth.uid()));

-- ============================================================================
-- Storage
-- ============================================================================
-- Four buckets. athlete-documents is private (birth certificates, USA
-- Wrestling cards); the other three are public so their contents render
-- directly on marketing pages, with writes restricted to staff.

-- athlete-documents (private) -----------------------------------------------
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

-- Co-guardian access. Paths are `<uploader_uid>/<athlete_id>/<file>`, so the
-- athlete id is the 2nd path segment.
CREATE POLICY "guardians_read_athlete_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'athlete-documents'
    AND public.guards_athlete(((storage.foldername(name))[2])::uuid)
  );
CREATE POLICY "guardians_upload_athlete_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'athlete-documents'
    AND public.guards_athlete(((storage.foldername(name))[2])::uuid)
  );

CREATE POLICY "admin_delete_athlete_docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'athlete-documents' AND public.has_role(auth.uid(), 'admin')
  );

-- tournament-flyers (public) --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-flyers', 'tournament-flyers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_tournament_flyers" ON storage.objects
  FOR SELECT USING (bucket_id = 'tournament-flyers');
CREATE POLICY "admin_insert_tournament_flyers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_tournament_flyers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_tournament_flyers" ON storage.objects
  FOR DELETE USING (bucket_id = 'tournament-flyers' AND public.has_role(auth.uid(), 'admin'));

-- sponsor-logos (public) ------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_sponsor_logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'sponsor-logos');
CREATE POLICY "admin_insert_sponsor_logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_sponsor_logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_delete_sponsor_logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsor-logos' AND public.has_role(auth.uid(), 'admin'));

-- site-content (public) --------------------------------------------------------
-- Writes are gated on is_full_admin, not has_role('admin'): a limited admin
-- can operate the club day-to-day but cannot swap public site imagery.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_site_content" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-content');
CREATE POLICY "full_admin_insert_site_content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));
CREATE POLICY "full_admin_update_site_content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));
CREATE POLICY "full_admin_delete_site_content" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-content' AND public.is_full_admin(auth.uid()));

-- ============================================================================
-- Regenerating this file
-- ============================================================================
-- Do not hand-edit. Regenerate from the real migration history:
--   1. Spin up a scratch Postgres 16, with `anon`/`authenticated`/`service_role`
--      roles and minimal auth.* / storage.* shims so the migrations that
--      reference them apply cleanly (auth.users, auth.uid(), auth.role(),
--      storage.objects, storage.buckets, storage.foldername()).
--   2. Replay every file in supabase/migrations/ against it, in filename order.
--   3. pg_dump --schema-only --schema=public --no-owner --no-privileges the
--      result -- that is the ground truth, not this file and not the
--      migrations read by eye.
--   4. Reassemble: group the dump's CREATE TABLE / constraint / index /
--      trigger / RLS statements by table (pg_dump emits them correctly but
--      alphabetically, not grouped), and hand-append the storage bucket and
--      policy statements (buckets aren't part of the public schema dump).
--      LANGUAGE sql functions (guards_owner, guards_athlete, has_role,
--      is_full_admin) must be reordered to run AFTER the tables and, for
--      guards_athlete, after guards_owner -- Postgres validates a SQL-
--      language function body against the live catalog at CREATE time,
--      unlike plpgsql, so pg_dump's alphabetical ordering is not safe here.
--   5. Test the regenerated file by running it against a *fresh* database
--      with the same shims and confirming zero errors end to end -- this is
--      what caught the function-ordering issue above; don't skip it.
