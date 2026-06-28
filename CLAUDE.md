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
