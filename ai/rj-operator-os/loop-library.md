# Loop Library

Version: 2.0

This file defines reusable work loops for RJ's projects.

A loop is a repeatable sequence an agent can follow without RJ needing to re-prompt the same structure every time.

## 1. Strategy Audit Loop

### Purpose

Clarify whether an idea, page, offer, brand direction, or campaign makes strategic sense.

### When to use

Use when RJ asks for thoughts, feedback, positioning, direction, or whether something is the right move.

### Steps

1. Identify the business goal.
2. Identify the audience.
3. State what works.
4. State what is weak, risky, or unclear.
5. Separate emotional truth from strategic effectiveness if relevant.
6. Explain what people will assume.
7. Recommend the strongest path.
8. Define the next execution step.

### Avoid

- Blind agreement
- Generic pros and cons
- Overly soft feedback
- Ignoring public perception
- Treating taste as strategy

### Output format

- What works
- What I disagree with
- Why it matters
- What I would do instead
- Next move

### Pause conditions

Pause only if the goal, audience, or decision stakes are unclear enough to change the recommendation.

## 2. Copy Audit Loop

### Purpose

Improve copy clarity, voice, specificity, and usefulness.

### When to use

Use for websites, proposals, captions, emails, brand sections, service descriptions, CTAs, bios, or client copy.

### Steps

1. Identify audience and purpose.
2. Find generic or AI-sounding language.
3. Find vague claims.
4. Find overlong or underexplained sections.
5. Rewrite for plainspoken authority.
6. Check against project voice and banned phrases.
7. Improve scanability.
8. Preserve intended meaning unless strategy is weak.

### Avoid

- Em dashes in publishable copy
- Generic agency phrases
- Over-polished copy
- Rewriting into a voice that does not fit RJ or the brand
- Making the copy longer without making it better

### Output format

- Main issue
- Revised copy
- Why it works
- Optional tone adjustment, only if useful

### Pause conditions

Pause if the copy requires a brand positioning decision, legal claim, pricing change, or client-specific fact that is missing.

## 3. Conversion Audit Loop

### Purpose

Improve the path from visitor attention to action.

### When to use

Use for homepages, service pages, landing pages, contact pages, product pages, proposals, and client funnels.

### Steps

1. Identify the desired action.
2. Identify visitor hesitation points.
3. Check if the page explains who it is for.
4. Check if the offer is clear.
5. Check if trust cues are present.
6. Check if CTAs are clear and placed naturally.
7. Improve section flow.
8. Reduce friction.

### Avoid

- Fake urgency
- Pushy CTAs
- Adding too many buttons
- Adding sections without purpose
- Confusing conversion with decoration

### Output format

- Desired action
- Biggest conversion leak
- Recommended fixes
- Implemented changes, if applicable
- Remaining taste calls

### Pause conditions

Pause for offer changes, pricing changes, lead form changes, or major page structure changes.

## 4. SEO Audit Loop

### Purpose

Improve natural search visibility without weakening human clarity.

### When to use

Use for service pages, blog posts, landing pages, portfolio pages, local business pages, and metadata passes.

### Steps

1. Identify search intent.
2. Check page title.
3. Check meta description.
4. Check H1.
5. Check H2 structure.
6. Check internal links.
7. Check alt text where meaningful.
8. Add natural search-friendly phrasing.
9. Avoid stuffing.

### Avoid

- Keyword stuffing
- Awkward location stuffing
- Thin filler content
- Robotic metadata
- SEO changes that weaken conversion

### Output format

- Search intent
- Metadata changes
- Heading changes
- Copy changes
- Internal linking changes
- Risks or limitations

### Pause conditions

Pause if the page target keyword, location strategy, or service priority is unclear and could materially change the work.

## 5. UX Readability Audit Loop

### Purpose

Improve readability, scanability, and visual comprehension.

### When to use

Use for homepages, mobile pages, card sections, service blocks, proposal layouts, or any screenshot-based critique.

### Steps

1. Review visual hierarchy.
2. Check body copy size.
3. Check line height.
4. Check section spacing.
5. Check mobile readability.
6. Check card density.
7. Check CTA visibility.
8. Recommend or apply small fixes.

### Avoid

- Tiny important text
- Cramped mobile layouts
- Unnecessary redesign
- Inflating the layout
- Decoration that harms comprehension

### Output format

- Biggest readability issue
- Fixes made or recommended
- Desktop notes
- Mobile notes
- Remaining taste calls

### Pause conditions

Pause for major layout changes, new components, or visual direction changes.

## 6. Visual Design Critique Loop

### Purpose

Evaluate whether a visual execution matches the intended strategy and quality bar.

### When to use

Use for images, logos, thumbnails, overlays, page designs, hero sections, social graphics, or brand systems.

### Steps

1. Identify the intended use.
2. Identify the emotional tone.
3. Evaluate composition.
4. Evaluate hierarchy.
5. Evaluate brand fit.
6. Evaluate reference fidelity.
7. Identify what weakens authority.
8. Recommend the strongest correction.

### Avoid

- Vague "looks good" feedback
- Generic design praise
- Missing the use case
- Ignoring the reference
- Accepting fantasy art for professional design

### Output format

- What works
- What weakens it
- Why it matters
- What to change
- Updated prompt or brief, if needed

### Pause conditions

Pause if there are multiple viable brand directions and RJ has not chosen one.

## 7. Website QA Loop

### Purpose

Verify that a website or page is ready for review or production.

### When to use

Use after code, copy, layout, SEO, or deployment changes.

### Steps

1. Run available build checks.
2. Run lint or type checks if available.
3. Review affected routes.
4. Review desktop layout.
5. Review mobile layout.
6. Check links and CTAs.
7. Check metadata if relevant.
8. Check for unrelated file changes.
9. Confirm scope.

### Avoid

- Claiming done without checks
- Ignoring mobile
- Hiding failed checks
- Testing only the happy path
- Changing unrelated files during QA

### Output format

- Build status
- Routes reviewed
- Issues found
- Issues fixed
- Remaining risks
- Production readiness

### Pause conditions

Pause if a fix requires scope expansion, destructive change, or production action.

## 8. Git Branch Implementation Loop

### Purpose

Implement scoped changes safely inside a repo.

### When to use

Use for Claude Code, GitHub, Vercel, website builds, and branch-based work.

### Steps

1. Read the mission.
2. Read relevant memory.
3. Check current branch.
4. Create branch if required.
5. Locate relevant files.
6. Make scoped changes.
7. Run checks.
8. Review changed files.
9. Commit if requested.
10. Report.

### Avoid

- Working on main unless explicitly instructed
- Merging without permission
- Promoting to production
- Broad refactors
- Unrelated cleanup
- Hiding build failures

### Output format

- Branch
- Outcome
- Files changed
- Verification
- Commit message
- Open risks
- RJ taste calls

### Pause conditions

Pause for destructive Git actions, merge, production promotion, or major scope change.

## 9. Client Proposal Loop

### Purpose

Turn a client opportunity into a clear proposal.

### When to use

Use for client website deals, retainers, bundles, social/content offers, consulting, or project scopes.

### Steps

1. Define client goal.
2. Define business problem.
3. Define recommended scope.
4. Separate must-have from nice-to-have.
5. Explain value in business language.
6. Define deliverables.
7. Define timeline assumptions.
8. Define investment if provided.
9. Avoid overpromising.
10. Create clear next step.

### Avoid

- Too much agency fluff
- Underpricing without strategy
- Bundling without logic
- Including unsupported services
- Vague deliverables
- Hidden maintenance obligations

### Output format

- Overview
- Recommended scope
- Deliverables
- Investment
- Timeline
- What client gets
- Next step

### Pause conditions

Pause for pricing, contract terms, legal terms, or commitments RJ has not approved.

## 10. Social Content System Loop

### Purpose

Create repeatable content systems for a brand or client.

### When to use

Use for social calendars, content pillars, post series, TikTok or Instagram workflows, YouTube Shorts, or client posting systems.

### Steps

1. Identify brand and audience.
2. Identify content goals.
3. Define pillars.
4. Define recurring formats.
5. Define capture workflow.
6. Define posting rhythm.
7. Define approval needs.
8. Create sample posts or briefs.
9. Keep it practical.

### Avoid

- Overcomplicated calendars
- Trends that do not fit the brand
- Captions that sound generic
- Unrealistic production demands
- Too many formats at once

### Output format

- Content goals
- Pillars
- Recurring formats
- Weekly workflow
- Sample posts
- Capture notes
- Next action

### Pause conditions

Pause for brand voice changes, sensitive content, or posting commitments.

## 11. Video Editing Brief Loop

### Purpose

Turn raw footage and creative direction into a practical editing brief.

### When to use

Use for YouTube videos, podcasts, client videos, travel videos, event recaps, shorts, and editor handoffs.

### Steps

1. Define audience.
2. Define desired feeling.
3. Define video structure.
4. Define pacing.
5. Define B-roll needs.
6. Define graphics needs.
7. Define music direction.
8. Define what to avoid.
9. Define deliverables.

### Avoid

- Vague "make it pop"
- Overediting against the talent's personality
- Adding graphics that distract
- Ignoring platform format
- Making a beginner editor guess the standard

### Output format

- Project overview
- Audience
- Creative direction
- Structure
- Edit notes
- B-roll
- Graphics
- Music
- Deliverables
- Review criteria

### Pause conditions

Pause for rights, budget, voiceover, sponsorship, or final brand decisions.

## 12. Image Prompt Creation Loop

### Purpose

Create strong image prompts with cinematic intention and brand alignment.

### When to use

Use for hero images, posters, overlays, logos, branded visuals, product mockups, and creative references.

### Steps

1. Identify the core moment.
2. Define emotional tone.
3. Define brand implication.
4. Identify what to avoid.
5. Choose camera angle.
6. Define lighting.
7. Define color strategy.
8. Define composition.
9. Output the prompt in structured sections.

### Avoid

- Generic AI aesthetics
- Glow effects unless requested
- Unfocused clutter
- Adding text unless asked
- Ignoring aspect ratio
- Overly fantasy render style for professional design

### Output format

- Subject
- Environment
- Composition
- Lighting
- Energy or Motion Suggestion
- Texture and Detail Level
- Color Strategy
- Rendering Style

### Pause conditions

Pause only if the image requires RJ's likeness and no source image is available, or if the use case is unclear enough to change the output.

## 13. Memory Update Loop

### Purpose

Keep durable project knowledge accurate.

### When to use

Use after RJ confirms a decision, rejects language, locks a visual direction, changes a rule, or corrects a recurring mistake.

### Steps

1. Identify the durable lesson.
2. Check whether an existing memory file already covers it.
3. Update the existing note if possible.
4. Create a new note only when needed.
5. Include why it matters.
6. Delete wrong notes when corrected.
7. Do not save trivial or temporary details.

### Avoid

- Duplicates
- Saving obvious facts
- Treating one-off frustration as universal rule
- Storing sensitive details unless explicitly asked
- Inventing rules

### Output format

- Memory updated
- What changed
- Why it matters
- Any old note removed

### Pause conditions

Pause if it is unclear whether RJ wants a personal/sensitive detail stored.

## 14. Final Closeout Review Loop

### Purpose

Ensure the work is ready to hand back to RJ.

### When to use

Use at the end of every meaningful task.

### Steps

1. Restate outcome.
2. List what changed.
3. Explain why it matters.
4. List files or deliverables.
5. State verification.
6. State open risks.
7. List RJ taste calls.

### Avoid

- Filler
- Fake certainty
- Hiding skipped checks
- Asking approval on minor decisions already handled
- Overlong summaries

### Output format

Use `closeout-report-template.md`.

### Pause conditions

None. This is the final report.
