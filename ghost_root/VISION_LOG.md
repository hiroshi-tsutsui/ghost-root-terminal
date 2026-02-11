[2026-02-11 21:00]
> CHANGES: ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Infinite Loop" (Script Debugging / Kill).
> MECHANICS: Added `/home/ghost/run_loop.sh`.
> LORE: A script is stuck in an infinite loop, consuming CPU.
> SOLUTION: `./run_loop.sh` (hangs) -> `Ctrl+C` -> `sed` to fix logic or just `rm`.
> NOTE: Since we can't easily simulate Ctrl+C interrupting a blocking JS function in this architecture, we'll make it a background job that respawns unless the source is fixed.

[2026-02-11 22:30]
> CYCLE 39: "The Docker Escape" (Containerization / ENV Vars).
> CHANGES: ghost_root/web/lib/Shell.ts
> MECHANICS: Added 'docker' command with ps/logs/inspect/stop/images.
> LORE: A rogue container ('secure-vault') holds sensitive configuration data.
> PUZZLE: Inspect the container environment variables to find the flag.
> SOLUTION: `docker ps` -> `docker inspect secure-vault` -> Find ENV `VAULT_KEY` -> Decrypt or use key.
> NOTE: Added 'docker' to man pages and command list.
