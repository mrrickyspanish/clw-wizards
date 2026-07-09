# Install Guide

Version: 2.0

This guide explains how to use RJ Operator OS across tools.

## 0. Older models and small context windows

For any tool or model with a small context window or tight instruction limits:

1. Paste `compressed-master-instruction.md` as the system or standing instruction. It is self-contained.
2. Paste the fast-version mission brief (bottom of `universal-mission-brief-template.md`) per task.
3. Attach only the single most relevant project memory file, not the whole folder.
4. Do not attach the full OS. Older models follow one clear instruction block better than ten files.

For capable models, use the tiered load order in `README.md`.

## 1. In a GitHub repo

Place the folder here:

`/ai/rj-operator-os/`

For each project, add:

`/ai/projects/[project-name]/`

At the start of every Claude Code mission, include:

Read `/ai/rj-operator-os/README.md` and the relevant `/ai/projects/[project-name]/` memory before acting.

## 2. In Claude Projects

Create a Claude Project for RJ operations or for a specific brand/client.

Add the RJ Operator OS files as Project Knowledge.

Add the compressed master instruction to Project Instructions.

For each brand or client, add the relevant project memory files as Project Knowledge.

Important: do not assume Claude has access to ChatGPT history. Provide the source packet.

## 3. In Manus, Alfred

Add the compressed master instruction as the standing instruction.

Attach the relevant OS files or paste the specific mission brief.

For larger missions, include:

- `handoff-to-alfred.md`
- `universal-mission-brief-template.md`
- `loop-library.md`
- Relevant project memory

## 4. In ChatGPT

Use the RJ Operator OS as the master source when creating strategy, prompts, briefs, proposals, critique, and handoffs.

When building a project-specific prompt, reference:

- RJ Operator OS
- Relevant project memory
- Current mission
- Source packet

## 5. In Google Drive

Store a portable copy in a folder such as:

`AI Operating Systems / RJ Operator OS`

Create project folders underneath it.

Keep the compressed instruction in a separate doc for easy copy/paste.

## 6. In new projects

For each new brand, client, or repo, create:

- `README.md`
- `brand-memory.md`
- `copy-rules.md`
- `visual-rules.md`
- `decision-log.md`
- `known-mistakes.md`

Start small. Add only confirmed durable rules.

## 7. Updating the OS

The repo copy at `/ai/rj-operator-os/` is canonical. All other copies (Drive, Claude Projects, Manus) are exports. When you change a file, bump its `Version:` line and re-export.

Update the master OS only when a rule applies broadly across RJ's work.

Update project memory when a rule applies only to one brand, client, or project.

Do not let project-specific taste pollute the universal system.

## 8. Recommended first test

Use this OS on a contained but real task, such as:

- CEMM supporting pages copy, conversion, and SEO pass
- A Claude Code branch for mobile readability
- A client proposal refresh
- A Yo Travelholics YouTube overlay brief
- A DJ Mz Chocolate about page update

The first test should reveal whether the agent asks fewer questions, avoids overbuilding, and reports back with better verification.
