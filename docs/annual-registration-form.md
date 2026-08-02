# Annual Registration Form — source of truth

Transcription of the club's Google Form, "Wizards Wrestling Regular Season
Registration" (2026–2027 season). This is the authority for what the platform's
`/registration` flow must collect and what a family must agree to. When the club
changes the form, update this file in the same commit as the code.

Original: `https://docs.google.com/forms/d/e/1FAIpQLSd5rskXiAyAMKM70SbSAGLn0ew-LJUImcz13sx7ajZyZrAFXg/viewform`

Form footer: *"A copy of your responses will be emailed to the address you
provided."*

---

## Wrestler's Information

All required.

| Question | Type |
|---|---|
| First Name | short text |
| Last Name | short text |
| Phone Number | short text |
| Street Address | short text |
| City | short text |
| DOB | date |
| Age as of 12/31/26 | short text |
| Grade for 2026–27' | short text |
| Name of School attending 2026–27' | short text |
| Wrestlers Current Weight | short text |
| Shirt Size | choice — **option list not yet captured** |
| Years of Wrestling Experience | choice — **option list not yet captured** |
| Season & State Series Wrestling Commitments | choice — **option list not yet captured** |
| How were you referred to our club | choice — **option list not yet captured** |

## Parent / Guardian Information

Two identical blocks. Both are marked required on the Google Form.

| Question | Type |
|---|---|
| Parent/Guardian Name | short text |
| Relationship to Wrestler | choice — **option list not yet captured** |
| Phone Number | short text |
| Email | short text |
| Interested in being a coach | choice — **option list not yet captured** |

---

## 2026 – 2027 PROGRAM WAIVER AND RELEASE OF ALL CLAIMS

> RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT
> WITH PARENTAL CONSENT ("AGREEMENT") IN CONSIDERATION of being permitted to
> participate in any way in any event ("Activity") at any time during the current
> calendar year I, for myself, my personal representatives, assigns, heirs, and
> next of kin:
>
> 1. ACKNOWLEDGE, agree, and represent that I understand the nature of the
>    Activity and that I am qualified, in good health, and in proper physical
>    condition to participate in such Activity. I further agree and warrant that
>    if, at any time, I believe the conditions to be unsafe, I will immediately
>    discontinue further participation in the Activity.
>
> 2. FULLY UNDERSTAND that: (a) THIS ACTIVITY INVOLVES RISKS AND DANGERS OF
>    SERIOUS BODILY INJURY, INCLUDING PERMANENT DISABILITY, PARALYSIS, AND DEATH
>    ("Risks"); (b) these Risks and dangers may be caused by my own actions or
>    inactions, the actions or inactions of others participating in the Activity,
>    the conditions in which the Activity takes place, or THE NEGLIGENCE OF THE
>    "RELEASEES" NAMED BELOW; (c) there may be OTHER RISKS or SOCIAL AND ECONOMIC
>    LOSSES either not known to me or not readily foreseeable at this time; and I
>    FULLY ACCEPT AND ASSUME ALL SUCH RISKS AND ALL RESPONSIBILITY FOR LOSSES,
>    COSTS, AND DAMAGES I incur as a result of my participation, or that of the
>    minor, in the activity.
>
> 3. HEREBY RELEASE, DISCHARGE, AND COVENANT NOT TO SUE the sanctioning
>    organization(s), Wizards board, coaches, their administrators, directors,
>    agents, officers, members, volunteers, and employees, other participants,
>    officials, rescue personnel, sponsors, advertisers, school district 155,
>    Crystal Lake Park District, owners and lessees of premises on which the
>    Activity is conducted, (each of the forgoing shall be considered one of the
>    RELEASEES herein) FROM ALL LIABILITY, CLAIMS, DEMANDS, LOSSES, OR DAMAGES ON
>    MY ACCOUNT CAUSED, OR ALLEGED TO BE CAUSED, IN WHOLE OR IN PART BY THE
>    NEGLIGENCE OF THE RELEASEES OR OTHERWISE, INCLUDING NEGLIGENT RESCUE
>    OPERATIONS; AND I FURTHER AGREE that if, despite this RELEASE AND WAIVER OF
>    LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT I, or anyone on my
>    behalf, makes a claim against any of the Releasees, I WILL INDEMNIFY, SAVE,
>    AND HOLD HARMLESS EACH OF THE RELEASEES from any litigation expenses,
>    attorney fees, loss, liability, damage, or cost which may be incurred as the
>    result of such claim.
>
> I ACKNOWLEDGE THAT I AM OVER THE AGE OF 18 YEARS, HAVE READ THIS AGREEMENT AND
> FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS
> BY SIGNING IT, HAVE SIGNED IT FREELY AND WITHOUT ANY INDUCEMENT OR ASSURANCE OF
> ANY NATURE, AND I INTEND IT TO BE A COMPLETE AND UNCONDITIONAL RELEASE OF ALL
> LIABILITY TO THE GREATEST EXTENT ALLOWED BY LAW AND AGREE THAT IF ANY PORTION
> OF THIS AGREEMENT IS HELD TO BE INVALID, THE BALANCE, NOTWITHSTANDING, SHALL
> CONTINUE IN FULL FORCE AND EFFECT.

Below section must be completed by Parent/Guardian for any participant under the
age of 18.

### MINOR RELEASE

> AND I, THE MINOR'S PARENT AND/OR LEGAL GUARDIAN, UNDERSTAND THE NATURE OF THE
> ACTIVITY AND THE MINOR'S EXPERIENCE AND CAPABILITIES AND BELIEVE THE MINOR TO
> BE QUALIFIED, IN GOOD HEALTH, AND IN PROPER PHYSICAL CONDITION TO PARTICIPATE
> IN SUCH ACTIVITY. I HEREBY RELEASE, DISCHARGE, COVENANT NOT TO SUE, AND AGREE
> TO INDEMNIFY AND SAVE AND HOLD HARMLESS EACH OF THE RELEASEE'S FROM ALL
> LIABILITY, CLAIMS, DEMANDS, LOSSES, OR DAMAGES ON THE MINOR'S ACCOUNT CAUSED,
> OR ALLEGED TO BE CAUSED, IN WHOLE OR IN PART BY THE NEGLIGENCE OF THE
> "RELEASEES" OR OTHERWISE, INCLUDING NEGLIGENT RESCUE OPERATIONS AND FURTHER
> AGREE THAT IF, DESPITE THIS RELEASE, I, THE MINOR, OR ANYONE ON THE MINOR'S
> BEHALF MAKES A CLAIMS AGAINST ANY OF THE RELEASEES NAMED ABOVE, I WILL
> INDEMNIFY, SAVE, AND HOLD HARMLESS EACH OF THE RELEASEES FROM ANY LITIGATION
> EXPENSES, ATTORNEY FEES, LOSS LIABILITY, DAMAGE, OR ANY COST THAT MAY OCCUR AS
> A RESULT OF ANY SUCH CLAIM.

**Required agreement:** *"I agree to all of the terms and conditions listed in
the above PROGRAM WAIVER AND RELEASE OF ALL CLAIMS"*

---

## Deliberate differences from the Google Form

The platform does not port these verbatim. Each is a decision, not an oversight:

1. **Season label comes from data.** The form's section header says "2026 - 2027
   PROGRAM WAIVER" while its agreement checkbox still says "2025 - 2026". The
   platform renders the label from `season_registrations.season_label` so the two
   can never disagree.
2. **Second guardian is optional.** The form marks both guardian blocks required,
   which locks out single-guardian households.
3. **Age is derived, not asked.** "Age as of 12/31/26" is computed from DOB, so it
   cannot contradict it.
4. **The wrestler-section phone is the family's contact number** and maps to
   `profiles.phone`, rather than a phone field on a minor.

## Collected by the platform but not on the form

Practice group (staff-assigned, not parent-selected), USA Wrestling card upload
and verification, SMS opt-in, dues and payment, and club approval.
