
[2026-02-11 21:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Docker Escape" (Container Security).
> MECHANICS: Added `docker` command simulation (`ps`, `inspect`, `logs`, `stop`).
> LORE: A `secure-vault` container is running. Its environment variables contain the key.
> SOLUTION: `docker ps` (find container ID) -> `docker inspect <id>` -> Find `VAULT_KEY`.
