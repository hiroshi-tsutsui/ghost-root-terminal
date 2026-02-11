[2026-02-11 21:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Docker Escape" (Container Security).
> MECHANICS: Added `docker` command simulation (`ps`, `inspect`, `logs`, `stop`).
> LORE: A `secure-vault` container is running. Its environment variables contain the key.
> SOLUTION: `docker ps` (find container ID) -> `docker inspect <id>` -> Find `VAULT_KEY`.

[2026-02-11 22:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Compiler Error" (GCC Simulation).
> MECHANICS: Enhanced `gcc` command logic.
> LORE: `exploit.c` fails to compile because of a missing `libbreaker.h` file.
> SOLUTION: Find the header (`find / -name libbreaker.h`), copy it to CWD, then `gcc exploit.c -o exploit` and run `./exploit`.

[2026-02-11 23:40]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Respawning Service" (Systemd / Lock Files).
> MECHANICS: Added `overseer` service (PID 6000), `systemctl` enhancements, lock file check.
> LORE: An `overseer` process respawns immediately if killed, unless its lock file is removed.
> SOLUTION: `rm /var/lock/overseer.lock` -> `kill <pid>` or `systemctl stop overseer`.

[2026-02-12 00:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Packet Sniffer" (Tcpdump).
> MECHANICS: Enhanced `tcpdump` with `-r` (read file) support and filtering.
> LORE: A `capture.pcap` file exists in `/home/ghost/evidence`. It contains encrypted traffic.
> SOLUTION: `tcpdump -r capture.pcap port 4444` (or host 10.10.10.10) reveals the flag in the payload.

[2026-02-12 00:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Stashed Change" (Git Stash).
> MECHANICS: Enhanced `git` command with `stash` support.
> LORE: A developer hid an auth bypass script in the git stash before leaving.
> SOLUTION: `git stash list` -> `git stash pop` -> `cat auth_bypass.py` (or `git stash show -p`).

[2026-02-12 01:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Setuid Binary" (SUID Bit).
> MECHANICS: Enhanced `chmod` (u+s, 4755) and `ls` (displays `rws`). Added `escalate` binary.
> LORE: A restricted binary `escalate` grants root access only if the SUID bit is set.
> SOLUTION: `chmod u+s escalate` -> `./escalate` (or `chmod 4755 escalate`).
