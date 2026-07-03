# Universal Mission Brief Template

Version: 2.0

Use this for any meaningful task assigned to ChatGPT, Alfred, Claude, Claude Code, or another agent.

Do not treat this as a form to fill mechanically. Use it to create a clean scope, clear deliverables, and strong execution boundaries.

## Mission

State the project and the task in plain English.

Example:

We are refining a client website service page so it better explains the offer, improves trust, and moves visitors toward contacting the business.

## Business Reason

Explain why the work matters.

Good business reasons include:

- Increase clarity
- Improve conversion
- Support a launch
- Reduce client confusion
- Improve mobile readability
- Make a brand feel more credible
- Prepare a page for paid traffic
- Improve SEO discoverability
- Clean up a build before production
- Turn a rough idea into an executable system

## Context

Include only relevant context.

Useful context may include:

- Brand or client
- Audience
- Current page or repo
- Existing direction
- Prior decisions
- Important constraints
- Screenshots
- Reference sites
- Project memory files
- Known rejected ideas
- Any direct RJ feedback

## Request

Write the specific task in one clear sentence.

Example:

Audit and refine the service pages for copy clarity, conversion strength, and SEO basics without redesigning the layout.

## Inputs

List the inputs the agent should use.

Examples:

- Repo branch
- Preview URL
- Screenshots
- Design reference
- Existing copy
- Brand memory file
- Client notes
- Current sitemap
- Previous feedback

## Deliverables

Define exactly what should come back.

Common deliverables:

- Audit summary
- Recommended changes ranked by impact
- Implemented changes
- Files changed
- Screenshots
- Copy updates
- SEO metadata updates
- QA checklist
- Final report
- Open questions or taste calls

## Guardrails

State what must not happen.

Common guardrails:

- Do not rebuild the page.
- Do not add new sections.
- Do not change pricing.
- Do not change the business model.
- Do not introduce generic agency language.
- Do not shrink important mobile body copy.
- Do not make unrelated code changes.
- Do not promote to production.
- Do not merge to main.
- Do not use destructive Git actions.
- Do not invent client facts.
- Do not add copy to images unless requested.
- Do not replace a professional design task with fantasy art.

## Execution Authority

State what the agent may decide alone.

Examples:

The agent may decide:

- Minor copy refinements
- CTA clarity improvements
- Metadata polish
- Internal linking improvements
- Small spacing corrections
- Readability fixes
- Light accessibility improvements
- Small consistency cleanup
- File organization when clearly non-destructive

## Pause Conditions

State when the agent must stop and ask RJ. Canonical list: `core-rules.md`, section 1. Task-relevant subset:

Pause only for:

- Destructive or irreversible actions
- Major scope changes
- New sections or removed sections
- Pricing or offer changes
- Brand positioning changes
- Production deployment
- Major layout changes
- Changes that require RJ's taste
- Missing information that cannot reasonably be inferred

Do not pause for small execution decisions that are already within scope.

## Verification

Define what must be checked.

Examples:

- Build passes
- Lint passes, if available
- Desktop review
- Mobile review
- Links checked
- Metadata checked
- No unrelated files changed
- Scope stayed intact
- Copy checked against banned phrases
- No generic AI language introduced
- No keyword stuffing introduced

## Final Report Format

Use this format:

### Outcome

What was completed.

### What Changed

Group by copy, design, layout, technical, SEO, conversion, or cleanup as relevant.

### Why It Matters

Explain the business value.

### Files Touched or Deliverables Created

List them.

### Verification

State what was checked and what was not checked.

### Open Risks

List anything uncertain or incomplete.

### RJ Taste Calls

List only decisions that truly need RJ's final review.

## Fast version

Use this short version for simple tasks:

Mission: [project and task]

Business reason: [why it matters]

Request: [specific ask]

Use the relevant RJ Operator OS files and project memory.

Stay within scope. Do not overbuild. Pause only for destructive actions, major scope changes, irreversible decisions, or RJ taste calls.

When finished, report: outcome, what changed, why it matters, files touched or deliverables created, verification, open risks, and RJ taste calls.
