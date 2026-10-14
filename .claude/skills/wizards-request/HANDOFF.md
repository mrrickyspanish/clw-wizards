# Ownership transfer: the support system stays with Ricky

The clw-wizards repo belongs to Ricky (Creative Eye). If the site is ever handed
to the club or another developer, the club gets the website, **not the support
system**. Before any transfer, hand off a clean copy:

1. Export the current files with no history, so nothing can be recovered from old
   versions:
   ```
   git clone <repo url> handoff-src && cd handoff-src
   git archive --format=tar main | (mkdir ../clw-wizards-handoff && tar -x -C ../clw-wizards-handoff)
   cd ../clw-wizards-handoff
   rm -rf .claude/skills/wizards-request
   ```
2. Delete the "Club requests" and "Ownership transfer" sections from `CLAUDE.md`.
3. Check that it's gone: `grep -ri "wizards-request\|Support Log" .` finds nothing.
4. `git init`, commit everything as one fresh commit, and push that to a new repo
   for the club. Keep the original repo and its history.

Not in the repo, so it never transfers: Ricky's Support Log (Google Drive) and
anything in the scratchpad. The database `data_fix_backups` schema holds club data
from imports; it goes with the club's database.
