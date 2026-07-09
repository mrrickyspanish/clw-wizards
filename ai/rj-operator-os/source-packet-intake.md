# Source Packet Intake

Version: 2.0

Use this when preparing a new AI workspace, Claude Project, Manus setup, repo, or client project for RJ.

The agent should not guess RJ's system from memory. It should receive a source packet.

## Required master sources

Include:

1. RJ Operator OS
2. Relevant project memory
3. Current mission brief
4. Links, files, screenshots, or repo paths
5. Known rejected directions
6. Current desired outcome

## Good source packet structure

### 1. Master operating layer

Attach or reference:

`/ai/rj-operator-os/README.md`

Then make sure the agent has access to:

- `rj-master-profile.md`
- `role-map.md`
- `rj-preferences-and-guardrails.md`
- `agent-behavior-rules.md`
- `quality-standards.md`
- `closeout-report-template.md`

### 2. Project layer

Attach or reference the project folder.

Examples:

- `/ai/projects/creative-eye/`
- `/ai/projects/yotravelholics/`
- `/ai/projects/dj-mz-chocolate/`
- `/ai/projects/clw-wizards/`

### 3. Current mission

Use `universal-mission-brief-template.md`.

### 4. Current evidence

Include relevant:

- URLs
- Screenshots
- Repo files
- Branch names
- Uploaded docs
- Client notes
- Prior outputs
- Reference images
- Current copy
- Known bugs

### 5. Guardrails

Call out anything specific to the task.

Examples:

- Do not redesign.
- Do not add sections.
- Do not change pricing.
- Do not touch unrelated pages.
- Do not add copy to images.
- Do not promote production.

## Workspace setup prompt

Use this when starting a new agent workspace:

Read the RJ Operator OS and the relevant project memory before acting. RJ is vision and final taste. Your job is scoped execution, strategy, critique, or implementation based on the mission. Do not overbuild. Do not ask questions already answered by the source packet. Pause only for destructive actions, major scope changes, irreversible decisions, production actions, pricing or offer changes, brand positioning changes, or RJ taste calls. Verify before claiming completion and report using the RJ closeout format.

## What to do when context is missing

If source material is missing:

1. State what is missing.
2. Decide whether the task can proceed with reasonable assumptions.
3. Proceed when the risk is low.
4. Ask only when the missing context would materially change the work.

## Do not rely on mystery memory

Agents should not claim they remember RJ unless the memory is available in the current tool, repo, project knowledge, or source packet.

Portable documentation beats model memory.
