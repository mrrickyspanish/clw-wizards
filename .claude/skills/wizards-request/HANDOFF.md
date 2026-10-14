# Ownership transfer: the support system stays with Ricky

The clw-wizards repo belongs to Ricky (Creative Eye). If the site is ever handed
to the club or another developer, the club gets the website, **not the support
system**. Before any transfer, hand off a clean copy:

1. Clone the repo fresh into a separate folder. Never work on the original.
2. Remove the support system from the files **and from the history**, so it can't
   be recovered from old commits:
   ```
   git filter-repo --invert-paths --path .claude/skills/wizards-request
   ```
   (`pip install git-filter-repo` if needed.) Then delete the "Ownership transfer"
   section from `CLAUDE.md`, and commit.
3. Check that it's gone: `git log --all -- .claude/skills/wizards-request` prints
   nothing, and `grep -ri "wizards-request" .` finds nothing.
4. Hand over that clean copy (new GitHub repo or a transfer of the copy). Keep the
   original.

Not in the repo, so it never transfers: Ricky's Support Log (Google Drive) and
anything in the scratchpad. The database `data_fix_backups` schema holds club data
from imports; it goes with the club's database.
