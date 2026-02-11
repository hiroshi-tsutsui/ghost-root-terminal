
[2026-02-11 16:30]
> CHANGES: ghost_root/web/lib/Shell.ts, ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Buried Commit" (Git History / Log / Show).
> MECHANICS: Added `git` command simulation (`status`, `log`, `show`). Added `/home/ghost/project_alpha` with `.git` directory.
> LORE: A developer hardcoded credentials in `config.json` but removed them in a later commit. The history is still there.
> SOLUTION: `cd project_alpha` -> `git log` (find "Remove hardcoded credentials") -> `git show <hash>` -> Key recovered.
