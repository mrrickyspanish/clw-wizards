-- Editable FAQ. A repeating list (question/answer), so a real table rather than
-- the key/value page_content store. Seeded with the FAQs currently hard-coded on
-- the FAQ page; the page falls back to that code copy if the table is empty.
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_faq" ON public.faq_items
  FOR SELECT USING (active = true);

CREATE POLICY "admin_write_faq" ON public.faq_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.faq_items (question, answer, sort_order) VALUES
  ($faq$How do I register, and what does it cost?$faq$,
   $faq$Registration includes a mandatory fundraiser: each wrestler sells 20 raffle tickets at $5 each ($100 total), so it costs your family $0, or you can buy out the books for a $50 credit toward tournaments. Separately, every family must purchase a USA Wrestling card online for each wrestler. Seasonal amounts and deadlines should be confirmed directly with the club before registering.$faq$, 1),
  ($faq$What do I need to bring to practice?$faq$,
   $faq$Shorts and a T-shirt without hoods, snaps, or zippers, plus a labeled water bottle. Wrestling shoes and headgear are needed once the wrestler begins regular practice. Please keep outside shoes off the mats.$faq$, 2),
  ($faq$How are practice groups organized?$faq$,
   $faq$Coaches place wrestlers where they will have the most success based on age, experience, maturity, technique, and practice readiness. Wrestlers may move groups as they develop or when they need a different level of challenge.$faq$, 3),
  ($faq$Do I need a singlet?$faq$,
   $faq$Singlets are worn at tournaments when representing Wizards Wrestling Club. Wrestlers purchase and keep their own singlet; rentals are rare. Confirm current pricing and availability with the club.$faq$, 4),
  ($faq$What do tournaments cost, and are they mandatory?$faq$,
   $faq$Tournaments are voluntary. The club typically attends one or two each weekend beginning in December. Entry fees are separate from club registration and are paid per event. Confirm current fees before registering for a tournament.$faq$, 5),
  ($faq$What are the IKWF age divisions?$faq$,
   $faq$IKWF divisions generally include Tots, Bantam, Midget, Novice, and Senior. Exact eligibility is determined by the current IKWF season rules and the wrestler’s age.$faq$, 6),
  ($faq$Can I coach or watch practice?$faq$,
   $faq$Coaching, or being inside the practice room beyond the club’s parent-viewing rules, may require a USA Wrestling coach card and applicable screening. Parent access varies by practice group and facility capacity. Ask the club what applies to your wrestler’s group.$faq$, 7),
  ($faq$Can we visit before joining?$faq$,
   $faq$New families should contact the club before arriving. A club leader can confirm the appropriate practice, whether the wrestler may participate or observe, and any waiver or equipment requirements for the visit.$faq$, 8),
  ($faq$Where do I park?$faq$,
   $faq$The facility is at 975 Nimco Dr, Unit L, Crystal Lake. Spots along the building are limited, with additional parking to the west. Please do not park in front of the garage door.$faq$, 9);
