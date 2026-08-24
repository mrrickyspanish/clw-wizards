-- Practice group is assigned by staff after a wrestler joins, not chosen on the
-- registration form (see docs/annual-registration-form.md, "Collected by the
-- platform but not on the form"). The column was NOT NULL anyway, which forced
-- anything creating an athlete outside the portal to invent a group.
--
-- That surfaced importing the 2026-2027 registration form: 129 wrestlers whose
-- submissions carry no group at all. A placeholder would have read as a real
-- assignment on the staff roster, so the column becomes nullable instead and an
-- unassigned wrestler renders as unassigned until staff places them.

ALTER TABLE public.athletes
  ALTER COLUMN practice_group DROP NOT NULL;
