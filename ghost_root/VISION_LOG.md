
[2026-02-11 21:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Docker Escape" (Container Security).
> MECHANICS: Added `docker` command simulation (`ps`, `inspect`, `logs`, `stop`).
> LORE: A `secure-vault` container is running. Its environment variables contain the key.
> SOLUTION: `docker ps` (find container ID) -> `docker inspect <id>` -> Find `VAULT_KEY`.

[2026-02-11 22:00]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Immutable Attribute" (File System Protection).
> MECHANICS: Added `chattr` and `lsattr` commands.
> LORE: `/var/log/surveillance.log` contains incriminating evidence but cannot be deleted.
> SOLUTION: `lsattr` (reveals `i` flag) -> `chattr -i <file>` -> `rm <file>`.
