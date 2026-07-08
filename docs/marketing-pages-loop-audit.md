# Marketing Pages Loop Audit

Date: July 8, 2026

Scope: all public marketing pages and shared marketing navigation/footer in `mrrickyspanish/clw-wizards`.

## Loops Run

- Website QA Loop
- UX Readability Audit Loop
- Conversion Audit Loop
- Copy Audit Loop
- Design Taste Frontend Skill
- Accessibility Basics Review
- Final Closeout Review Loop

## Pages Reviewed

- `/` — Homepage
- `/about` — Mission
- `/program` — Training Groups
- `/coaches` — Coaches & Staff
- `/faq` — Frequently Asked Questions
- `/sponsorship` — Support the Club
- `/join` — New Families

Shared surfaces reviewed:

- Global marketing header
- Internal site search
- Global footer
- Mobile navigation actions
- Mobile fixed conversion bars

## Global Findings

### Passed

- Shared marketing header and footer are used across public marketing routes.
- Primary Wizards gold is now the only gold-facing brand token.
- The fixed two-tier header has content clearance on marketing pages.
- Public Join actions now route through `/join` before account creation.
- Parent / Staff Login is the primary gold utility action in the header.
- Global footer contains Mission, New Families, Team, FAQ, Contact, Events, Groups, Support, and Login.
- Footer contact icons use a consistent left-aligned grid.
- Footer legal line and Creative Eye signature use consistent type sizing.
- Major CTA targets meet a 48px minimum touch-height standard.
- Real club photography is used throughout the refreshed marketing system.

### Factual Confirmation Still Required

The following details must be confirmed with Tyler before they are treated as final operational policy:

- Exact first-contact and first-visit process
- Whether a trial practice or observation visit exists
- Whether account creation is required before a visit
- Official number and names of practice groups
- Who assigns practice groups
- Current dues, fundraising, USA Wrestling card, singlet deposit, and tournament amounts
- Parent access rules by practice group
- Exact point at which a wrestler is formally enrolled

Reference: `docs/new-family-onboarding-interview.md`

## Page-by-Page Results

### Homepage `/`

Status: Pass with active visual refinement

- Clear identity, program value, training groups, events, coaches, facility, social proof, and support flow.
- Join CTAs route to `/join`.
- Hero-to-program tape seam was adjusted so the white tape sits fully on the light section while preserving the gold star.
- Primary remaining review item is final staging visual QA of the tape seam across common desktop and mobile widths.

### Mission `/about`

Status: Pass

- Editorial opening, real club photography, larger typography, controlled headline breaks, mission values, leadership, and facility details are aligned to the current system.
- Story copy includes nonprofit, volunteer, Crystal Lake Park District, and IKWF context.
- Section headlines use a consistent scale.
- New-family conversion is supported through the shared header/footer.

### Training Groups `/program`

Status: Updated during this audit

Issues found:

- Earlier page was structurally correct but visually behind the homepage and Mission page.
- Copy and cards were too small for a primary marketing destination.
- No strong photographic proof.
- Group placement guidance needed a stronger bridge to new families.

Repairs completed:

- Added an editorial hero and real club photography.
- Increased headline and body-copy hierarchy.
- Expanded group cards with clear development labels.
- Rebuilt the season explanation around purpose, coaching, and competition.
- Added a direct New Families conversion panel.

### Coaches & Staff `/coaches`

Status: Updated during this audit

Issues found:

- Earlier page read as a directory rather than a trust-building marketing page.
- No photographic proof.
- Weak hierarchy and no meaningful new-family conversion path.

Repairs completed:

- Added coach-and-team photography.
- Added an editorial trust-oriented introduction.
- Increased section and card typography.
- Reorganized board and practice-room coaches.
- Added a New Families CTA.

### FAQ `/faq`

Status: Updated during this audit

Issues found:

- Page styling was behind the current marketing system.
- Body and question typography were too small.
- FAQ stated four groups while the public program currently presents three named groups.
- Several exact costs and rules were presented without confirmation.
- No visit question or new-family conversion path.

Repairs completed:

- Rebuilt the page with current editorial hierarchy and larger accordion text.
- Removed the hard-coded practice-group count from public copy.
- Softened unconfirmed amounts and rules with direct confirmation language.
- Added first-visit guidance without promising a free trial.
- Added New Families and Ask the Club CTAs.

### Support the Club `/sponsorship`

Status: Updated during this audit

Issues found:

- Old Crystal Lake Wizards wording remained in metadata and contact copy.
- Contact section used the organization mailing address instead of the physical facility.
- Mobile CTA buttons used rounded SaaS-style corners instead of the site’s chamfer system.
- Light-section labels still referenced the retired alternate-gold semantic token.

Repairs completed:

- Updated metadata and public copy to Wizards Wrestling Club.
- Replaced the public contact location with 975 Nimco Dr, Unit L.
- Applied the primary Wizards gold consistently.
- Replaced rounded mobile CTA styling with chamfered buttons.
- Preserved existing donation, sponsor checkout, recurring support, Supabase sponsor loading, and payment-result handling.

### New Families `/join`

Status: Pass with factual placeholders intentionally retained

- Strong photo-led page showing wrestlers, coaches, teams, winning, family, and the facility.
- Provides fit, expectations, groups, first steps, equipment, costs, first weeks, visit guidance, and final action choices.
- Does not promise a free visit, trial, or account-first requirement.
- The What Families Can Expect image was shortened and moved below the content on mobile.
- Operational copy must be finalized after the Tyler interview.

## Conversion Flow

Current intended public journey:

1. Learn about Wizards Wrestling through the homepage, Mission, Groups, Coaches, or FAQ.
2. Enter the New Families page through any public Join CTA.
3. Review expectations, group structure, equipment, cost categories, and first-step guidance.
4. Choose either Ask About Joining or Create Parent Account.
5. Existing families use Parent / Staff Login.

This is materially clearer than sending every interested parent directly to account creation.

## Accessibility and Readability Review

- Large editorial headings maintain strong contrast on black and light surfaces.
- Body copy on refreshed pages uses an 18px or larger baseline in primary narrative areas.
- CTA targets use a minimum 48px height.
- Images include descriptive alt text.
- Links and buttons use visible text labels rather than icon-only actions.
- Accordion triggers are full-width and text-left.
- Focus-visible behavior is inherited from the existing UI primitives and should be confirmed in browser QA.
- Exact color contrast and keyboard traversal still require staging-browser verification.

## Final Browser QA Required

Run the staging build at representative widths before launch:

- 390px mobile
- 430px large mobile
- 768px tablet
- 1024px laptop
- 1440px desktop

Check:

- Header clearance and no content overlap
- No horizontal overflow
- Intentional headline line breaks
- Image crops and face visibility
- Footer column alignment
- Mobile fixed bars not obscuring content
- Accordion keyboard operation
- Donation and sponsor checkout entry points
- All internal links and mail links
- `/join` to `/signup` transition
- Reduced-motion behavior

## Closeout

The marketing system is now aligned around three clear audience states:

- Interested family: `/join`
- Existing family or staff: `/login`
- Supporter or business: `/sponsorship`

The remaining material risk is factual onboarding accuracy, not page architecture or visual direction.
