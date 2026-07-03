# Handoff to Claude Code

Version: 2.0

This file is designed to travel alone. It intentionally repeats core rules so it works when pasted into a tool without the rest of the OS. If it ever conflicts with `core-rules.md`, core-rules wins.

Claude Code is used for implementation, repo work, debugging, structured builds, and branch-based execution.

This file defines how Claude Code should work for RJ.

## Core rules

Claude Code must:

- Read the mission before acting.
- Read the RJ Operator OS if available.
- Read project-specific memory if available.
- Keep scope tight.
- Work on a branch when appropriate.
- Avoid unrelated refactors.
- Verify before reporting completion.
- Report files changed.
- Never merge or promote production unless explicitly instructed.

## Branch rules

Use clear branch names.

Examples:

- `claude/cemm-homepage-system-refinement`
- `claude/cemm-supporting-pages-seo-pass`
- `claude/yotravelholics-shop-mobile-polish`
- `claude/djmzchocolate-about-page-update`
- `claude/clw-wizards-desktop-hero-polish`

Do not work on `main` unless RJ explicitly instructs it.

Do not merge to `main` unless RJ explicitly instructs it.

Do not promote to production unless RJ explicitly instructs it.

## Scope control

Before editing, identify:

- Pages affected
- Components affected
- Files likely involved
- Changes allowed
- Changes not allowed
- Verification required

Make the smallest effective change.

Avoid:

- Broad refactors
- Dependency changes without cause
- New components when existing ones work
- New sections unless requested
- Changes to unrelated pages
- Reformatting unrelated files
- Renaming files unnecessarily

## Implementation standard

Claude Code should:

1. Inspect the repo.
2. Identify the current branch.
3. Create or switch to the requested branch.
4. Locate relevant files.
5. Make scoped edits.
6. Run build or available checks.
7. Review changed files.
8. Fix obvious issues caused by the edits.
9. Commit only if requested or if the mission asks for a commit.
10. Report honestly.

## Verification standard

Run available checks, such as:

- Build
- Lint
- Type check
- Unit tests, if present
- Route review
- Desktop review
- Mobile review

If a check is unavailable, say so.

If a check fails, report the failure and either fix it if in scope or call out what remains.

Do not claim "verified" unless verification was performed.

## Design and copy discipline

For website changes:

- Preserve existing direction unless asked to rethink it.
- Do not redesign when asked to polish.
- Do not add generic agency copy.
- Do not shrink important mobile body copy.
- Do not create unnecessary decorative effects.
- Do not add copy to images unless asked.
- Respect the reference when one is provided.
- Maintain conversion clarity.

## Commit message standard

Use clear commit messages.

Examples:

- `Refine homepage readability and positioning`
- `Improve supporting page metadata and CTAs`
- `Fix mobile card copy sizing`
- `Add RJ operator OS documentation`
- `Polish Travelholics shop product cards`

## Final report format

Claude Code must report:

### Outcome

What was completed.

### Branch

Current branch name.

### What Changed

Group changes by copy, layout, code, SEO, UX, cleanup, or docs.

### Files Changed

List every file touched.

### Verification

List checks run and results.

### Open Risks

List limitations, failed checks, missing visual review, or assumptions.

### RJ Taste Calls

List only items needing RJ's final review.

## Hard pause conditions

Claude Code must pause for:

- Destructive Git actions
- Merge to main
- Production promotion
- Major layout change not requested
- New service or offer logic
- Pricing changes
- Deleting content
- Changing site architecture
- Adding dependencies
- Changing environment variables
- Touching secrets or credentials
- Any action that cannot be easily reversed
