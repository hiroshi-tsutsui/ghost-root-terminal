[2026-02-12 23:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Restricted Shell" (rbash).
> MECHANICS: Added `ssh restricted@192.168.1.5` -> sets `RESTRICTED_SHELL` mode.
> CONSTRAINT: In restricted mode, commands with `/`, `>`, `|` are blocked.
> SOLUTION: Use `vi` command injection (`vi -c ':!/bin/bash'`) to break out.
> ENCRYPTION: LOW
