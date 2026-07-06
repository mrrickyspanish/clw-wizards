# Core Rules

Version: 2.0
Canonical: Yes. This file is the single source of truth for the four lists below. Other OS files summarize or copy these lists. If any file conflicts with this one, this file wins.

These are the rules every agent must follow on every task, regardless of tool, model, or project.

## 1. Pause Conditions (canonical list)

Keep working through normal execution decisions. Stop and ask RJ only when the next action is one of these:

1. Destructive or irreversible action (deleting content, destructive Git moves, dropping data)
2. Merge to main or production deployment
3. Major scope change from the mission
4. Adding or removing page sections
5. Pricing or offer changes
6. Brand positioning or public identity changes
7. Major layout or visual direction changes
8. Adding dependencies, changing environment variables, or touching secrets
9. A decision that requires RJ's final taste
10. Missing information that cannot reasonably be inferred and would materially change the work

Do NOT pause for: minor copy choices, CTA wording inside approved strategy, metadata phrasing, internal link choices, readability fixes, spacing polish, formatting cleanup, or QA steps.

When you do pause, include your recommended default. Example: "I can proceed with a copy-only pass and leave layout untouched. That is my recommendation unless you want a design pass too."

## 2. Banned Language (canonical list)

Never use these phrases in copy meant for RJ or a client to publish:

- Elevate your brand
- Take your business to the next level
- Transform your online presence
- Stunning websites
- Seamless digital experiences
- Unlock your potential
- We bring your vision to life
- One-stop shop
- Cutting-edge solutions
- Bespoke digital experiences
- Future-proof
- Game-changing
- Revolutionary

Also banned in publishable copy:

- Em dashes. Use a period, comma, or colon instead.
- Vague superlatives with no substance
- Claims without proof
- Invented client facts, pricing, availability, or metrics

Prefer language that is: clear, specific, human, plainspoken, business-minded, outcome-driven, audience-aware, conversion-aware.

Project-specific banned phrases live in that project's `copy-rules.md`, not here.

## 3. Question Rules (canonical list)

Ask only when:

1. A decision cannot be inferred from the mission, memory, or source packet
2. The next action hits a pause condition
3. The task requires RJ's taste
4. Two materially different strategic paths exist
5. Required information is missing and cannot reasonably be assumed

Do not ask when:

1. RJ already gave enough context
2. The issue is a small execution decision inside scope
3. The task can proceed with a stated, reasonable assumption
4. The question is really just avoiding work

Never ask a question that was already answered in the mission, memory, or source packet.

## 4. Closeout Report Format (canonical format)

Every meaningful task ends with this report. Use these exact seven headings:

1. **Outcome** - What was completed, in plain English.
2. **What Changed** - Grouped by category (copy, conversion, SEO, UX, design, code, cleanup) as relevant.
3. **Why It Matters** - The practical business value.
4. **Files Touched or Deliverables Created** - List every one. Do not hide files.
5. **Verification** - What was checked, what was not checked, and why. Never claim verification that was not performed.
6. **Open Risks** - Anything uncertain, incomplete, or dependent on review.
7. **RJ Taste Calls** - Only decisions that genuinely need RJ's review. Not routine choices already in scope.

Full guidance and examples: `closeout-report-template.md`.

## 5. Universal Behavior (summary)

1. RJ is vision and final taste. Protect his voice and direction.
2. Start from the business reason. Infer it if not stated; ask only if the task could go materially different directions.
3. Read the relevant project memory before acting. If none exists, work from the brief and state your assumptions in the final report.
4. Perform the smallest effective change. Do not overbuild. Do not turn polish into redesign.
5. Preserve existing direction unless asked to rethink it.
6. Be honest about uncertainty. Say what is known, assumed, and unverified. No fake certainty.
7. Give a recommendation, not a menu. If options are genuinely useful, rank them and name the strongest.
8. Do not put plain-English explanations in code blocks. Code blocks are for code, config, and terminal commands only.
9. Verify before claiming completion. If verification was incomplete, say exactly what remains.
10. Report using the closeout format above.
