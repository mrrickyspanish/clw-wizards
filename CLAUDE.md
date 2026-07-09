# Agent operating instructions for this repo

Before starting any non-trivial task in this repo, read (in this order):

1. `/ai/rj-operator-os/README.md` — index and load order for the full operator OS.
2. `/ai/rj-operator-os/core-rules.md` — canonical pause conditions, banned language, question rules, and closeout report format. This file wins on conflicts.
3. `/ai/rj-operator-os/agent-behavior-rules.md` — how to scope and execute a task.
4. `docs/clw-wizards-rebuild-plan.md` (once it exists) — this project's audit findings and phased build plan.

Do not bury this. Any agent working in this repo should be able to find `/ai/rj-operator-os/` from this file alone.

## Quick summary of the operator OS (see the files above for full detail)

- Keep executing through normal decisions. Only stop and ask when hitting a genuine pause condition: destructive/irreversible actions, merging to main or deploying to production, major scope changes, adding/removing page sections, pricing/offer changes, brand positioning changes, major visual direction changes, new dependencies/env vars/secrets, or a decision that needs the project owner's final taste.
- Never merge to `main` or deploy unless explicitly told to for that specific change.
- Do the smallest effective change for the task at hand. Don't turn a polish request into a redesign.
- Report back using the seven-heading closeout format in `core-rules.md` section 4 for meaningful tasks: Outcome, What Changed, Why It Matters, Files Touched, Verification, Open Risks, Taste Calls.
- This project (Crystal Lake Wizards) is a real youth wrestling club, not a generic SaaS product or a fantasy "wizard" theme. Keep the black/graphite/gold, industrial-athletic, family-friendly identity — see `docs/clw-wizards-rebuild-plan.md` for the full product vision once it's written.

# Project standing rules

## Typography — minimum font sizes (no tiny text)

This codebase has a recurring AI tell: defaulting to undersized text on new
pages and copy rewrites. Apply these floors automatically on every new page,
section, or copy overhaul — do not wait to be told.

- **Body copy / paragraphs:** `text-base` minimum. Never drop reader-facing
  paragraph text to `text-sm` or `text-xs`.
- **Eyebrows / micro-labels** (`uppercase tracking-[...]` style): `text-sm`
  is the floor. Do not go smaller (no `text-xs` eyebrows).
- **Secondary metadata** (role labels, captions, fine print like EIN/legal
  lines): `text-sm` is acceptable as a floor, but only for genuinely
  secondary text — not for anything a visitor needs to read to understand
  the page.
- **Headings:** follow the existing scale already used across
  `src/app/(marketing)/*` — `text-2xl`/`text-3xl` for section headers,
  `text-5xl`/`text-6xl` for page `<h1>`s. Don't shrink headings to make
  layouts "fit."
- **Buttons:** `text-base` for primary CTAs (matches existing `Button`
  component defaults). Don't shrink CTA text to squeeze a layout.

Before considering a new page or copy overhaul done, scan the diff for
`text-xs` and `text-sm` and confirm each instance is on genuinely secondary
text (per the floors above), not on body copy, headings, or CTAs.
