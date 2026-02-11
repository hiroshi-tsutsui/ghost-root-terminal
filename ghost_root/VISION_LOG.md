
[2026-02-11 21:00]
> CHANGES: ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Infinite Loop" (Script Debugging / Kill).
> MECHANICS: Added `/home/ghost/run_loop.sh`.
> LORE: A script is stuck in an infinite loop, consuming CPU.
> SOLUTION: `./run_loop.sh` (hangs) -> `Ctrl+C` -> `sed` to fix logic or just `rm`.
> NOTE: Since we can't easily simulate Ctrl+C interrupting a blocking JS function in this architecture, we'll make it a background job that respawns unless the source is fixed.
