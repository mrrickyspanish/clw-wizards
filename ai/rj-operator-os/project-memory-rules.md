# Project Memory Rules

Version: 2.0

## Purpose

Project memory keeps durable decisions attached to the work so RJ does not have to repeat himself every time.

The RJ Operator OS is universal.

Project memory is specific to a brand, client, repo, campaign, or deliverable.

## Where memory should live

Use one memory folder per project.

Examples:

`/ai/projects/creative-eye/`  
`/ai/projects/yotravelholics/`  
`/ai/projects/dj-mz-chocolate/`  
`/ai/projects/clw-wizards/`  
`/ai/projects/second-baptist/`  
`/ai/projects/upright-freight/`  
`/ai/projects/thumbs-up-cabinetry/`

## What to store

Store durable project facts such as:

- Confirmed brand positioning
- Approved voice direction
- Rejected phrases
- Visual preferences
- Logo rules
- Color rules
- Site structure decisions
- Offer logic
- Pricing logic, only when confirmed
- Audience definitions
- CTA preferences
- Design references
- Technical repo notes
- Known mistakes to avoid
- Final locked decisions

## What not to store

Do not store:

- Temporary thoughts
- Draft ideas not approved
- Obvious facts already in repo
- Duplicate notes
- Random emotional comments unless they define a durable rule
- Sensitive personal details unless RJ explicitly asks
- Assumptions not confirmed
- Contradictory old notes once corrected

## Memory file structure

Each project should include:

1. `README.md`
   Explains the project and points to key rules.

2. `brand-memory.md`
   Positioning, audience, voice, design taste, language rules.

3. `site-or-build-memory.md`, if applicable
   Routes, components, layout rules, technical notes.

4. `copy-rules.md`
   Preferred language, banned language, CTA rules, tone notes.

5. `visual-rules.md`
   Logo, image, color, typography, layout, reference fidelity.

6. `decision-log.md`
   Confirmed decisions with dates when useful.

7. `known-mistakes.md`
   Recurring errors agents must avoid.

## Memory entry format

Use this format for durable lessons:

### [Short lesson title]

Summary: One sentence.

Status: Confirmed / Rejected / Updated / Superseded

Applies to: Project, page, brand, client, or workflow.

Rule: The actual instruction.

Why it matters: Explain the strategic or practical reason.

Source: RJ confirmation, project file, repo evidence, or final approved output.

Updated: YYYY-MM-DD when useful.

## Confirmed vs inferred

Use labels:

- Confirmed: RJ clearly approved or stated it.
- Inferred: Agent concluded from context, but RJ has not explicitly confirmed.
- Rejected: RJ explicitly rejected it.
- Superseded: A newer decision replaced it.

Agents should treat confirmed rules as stronger than inferred rules.

## Updating memory

When adding new memory:

1. Search existing project memory.
2. Update the existing note if the topic already exists.
3. Create a new note only when necessary.
4. Remove or mark old conflicting notes as superseded.
5. Keep it short and practical.

## Child memory vs master OS

Do not put project-specific taste into the master RJ Operator OS unless it truly applies across all projects.

Example:

- Universal rule: Avoid generic AI aesthetics.
- Project rule: DJ Mz Chocolate should not use "grown-folks" in copy.
- Project rule: Yo Travelholics should use nautical or tropical overlays that work for tips, rankings, and ship content, not only destination videos.
- Project rule: CLW Wizards needs professional sports logo language, not 3D fantasy art.

## Memory source packet

When asking a model to create or update memory, provide source material.

Good sources:

- Approved copy
- Screenshots
- RJ feedback
- Final prompts
- Proposal documents
- Site files
- Repo documentation
- Existing memory files

Do not ask a model to guess RJ's memory from nowhere.

## Memory update report

When memory is updated, report:

- What was added
- What was changed
- What was removed or superseded
- Why it matters
- Whether anything needs RJ confirmation
