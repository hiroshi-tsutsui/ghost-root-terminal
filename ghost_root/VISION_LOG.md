
[2026-02-11 17:00]
> CHANGES: ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Memory Leak" (Volatility / Memory Forensics).
> MECHANICS: Added `/home/ghost/memory_analysis.txt` hint. `volatility` command already supported.
> LORE: A system crash dump (`/tmp/core.dump`) contains the command line arguments of a rogue process.
> SOLUTION: `cat memory_analysis.txt` -> `volatility -f /tmp/core.dump cmdline` -> Flag recovered (`GHOST_ROOT{M3M0RY_L34K_D3T3CT3D}`).
