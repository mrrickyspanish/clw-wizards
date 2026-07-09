# What Changed in Version 2.0

Refinement pass for clarity, portability, and older-model usability. RJ's operating model, preferences, and guardrails are preserved. Nothing was softened or removed except one project-specific line (noted below).

## Structural changes

### 1. New file: core-rules.md (canonical source)
The pause conditions, banned language, question rules, and closeout format appeared in 6+ files in slightly different versions. That is a drift hazard: update one copy, the others rot. `core-rules.md` is now the single canonical source. Other files carry short summaries plus a pointer. A conflict rule was added to the README: core-rules wins for those four lists; project memory wins over the master OS for everything else; the current mission brief wins over both.

### 2. Tiered load order (README)
V1 asked agents to read 7+ files before starting. Small models and tight instruction limits cannot do that. The README now defines three tiers:
- Tier 1: compressed-master-instruction.md only (self-contained)
- Tier 2: core-rules + rj-master-profile + one handoff file + project memory
- Tier 3: the full OS
Every tier works standalone.

### 3. Compressed master instruction rewritten
Now ~450 words, fully self-contained, numbered, imperative. It includes the pause list, the banned-phrase list, the code rules, the feedback structure, and the exact seven-heading closeout format. This is the file to paste into any older model or space-limited tool. It no longer depends on any other file.

### 4. Role abstraction (README + role-map)
Tools are now assignments to permanent roles: Strategist (ChatGPT), Executor (Manus/Alfred), Builder (Claude/Claude Code), Specialists. If a tool is replaced, the replacement inherits the role's rules. The OS already said "tools may change, the model should remain stable" — this makes that operational instead of aspirational.

### 5. Handoff files marked as intentional standalone copies
handoff-to-alfred.md and handoff-to-claude-code.md travel alone into other tools, so they keep their duplicated rules on purpose. Each now says so at the top, with a note that core-rules wins on conflict.

## Usability changes

### 6. QA checklist converted to real checkboxes
`- [ ]` format so it can be pasted into a session and literally checked off. Added rule: every unchecked item must be explained in the final report.

### 7. Install guide: new section 0 for older models
Explicit setup for small-context tools: paste the compressed instruction as the standing instruction, use the fast-version mission brief per task, attach one memory file, do not attach the full OS.

### 8. Versioning added
Every file carries a Version line. The repo copy is declared canonical; Drive/Claude Projects/Manus copies are exports. This prevents the multi-location copies the install guide encourages from silently diverging.

### 9. Typography normalized
All curly quotes, ellipsis characters, and non-breaking spaces converted to plain ASCII. Curly quotes break some pipelines, diff poorly, and get mangled when pasted between tools. (Em dashes were already absent, consistent with RJ's own rule.)

## Content corrections

### 10. "Grown-folks" removed from the master banned list
The install guide's own rule says project-specific taste must not pollute the universal OS. "Grown-folks" is a DJ Mz Chocolate decision and already lives in project-memory-rules as the example. It was removed from rj-preferences-and-guardrails and belongs in `/ai/projects/dj-mz-chocolate/copy-rules.md`.

### 11. Quality-standards image prompt section defers to creative-output-rules
Same content existed in both files. Quality-standards now carries the summary plus a pointer.

## Flagged for RJ (not changed)

- **Business name inconsistency.** The OS says "Creative Eye Multimedia" and uses the CEMM abbreviation throughout. If the current public brand is "Creative Eye Studios," that is a find-and-replace decision only RJ should make, since it touches branch-name examples and positioning language. V2 neutralized the README to "Creative Eye" where it was easy, but rj-master-profile, install-guide examples, and branch examples still say Multimedia/CEMM. Confirm which name is canonical and update in one pass.
