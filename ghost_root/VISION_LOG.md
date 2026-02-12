[2026-02-12 23:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Restricted Shell" (rbash).
> MECHANICS: Added `ssh restricted@192.168.1.5` -> sets `RESTRICTED_SHELL` mode.
> CONSTRAINT: In restricted mode, commands with `/`, `>`, `|` are blocked.
> SOLUTION: Use `vi` command injection (`vi -c ':!/bin/bash'`) to break out.
> ENCRYPTION: LOW

[2026-02-13 00:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Corrupted Binary" (Cycle 90).
> MECHANICS: Added `/usr/bin/recover_tool` with binary junk and hidden strings.
> CONSTRAINT: Execution causes segmentation fault. `cat` shows binary garbage.
> SOLUTION: Use `strings recover_tool` to extract the hidden flag.
> ENCRYPTION: LOW

[2026-02-13 00:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Missing Library" (Cycle 91).
> MECHANICS: Added `/usr/bin/quantum_calc` which depends on `/opt/libs/libquantum.so.1`.
> CONSTRAINT: Execution fails with "error while loading shared libraries".
> SOLUTION: `export LD_LIBRARY_PATH=/opt/libs` before running.
> ENCRYPTION: LOW
