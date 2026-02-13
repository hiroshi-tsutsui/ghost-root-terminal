
[2026-02-14 01:25]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Zombie Process" (Cycle 126).
> MECHANICS: Added `zombie_maker` (PID 3000) and `[child_worker] <defunct>` (PID 3001, STAT Z).
> COMMANDS: Updated `kill` to handle zombie state logic.
> CONSTRAINT: User cannot kill zombie (3001) directly ("Operation not permitted").
> SOLUTION: Identify parent (PPID 3000) -> `kill 3000`.
> ENCRYPTION: LOW

[2026-02-14 02:00]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Corrupted Archive" (Cycle 127).
> MECHANICS: Added `backup.tar.gz` with mismatching header (TAR_V1 vs GZIP).
> COMMANDS: Updated `tar` to enforce gzip header check if extension is `.gz`. Updated `file` command to identify TAR_V1 correctly.
> CONSTRAINT: `tar -xvf backup.tar.gz` fails with "gzip: stdin: not in gzip format".
> SOLUTION: `mv backup.tar.gz backup.tar` -> `tar -xvf backup.tar`.
> ENCRYPTION: LOW

[2026-02-14 02:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Encoded Binary" (Cycle 128).
> MECHANICS: Added `suspicious.txt` (Base64 encoded binary) in `~/downloads`.
> COMMANDS: Updated execution logic to handle `#!BINARY_SIM_V1` header.
> CONSTRAINT: File is text, not executable.
> SOLUTION: `base64 -d suspicious.txt > binary` -> `chmod +x binary` -> `./binary`.
> ENCRYPTION: LOW

[2026-02-14 06:33]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The SetUID Binary" (Cycle 138).
> MECHANICS: Added `/usr/bin/backdoor` (SUID 4755). Added `find -perm` support.
> CONSTRAINT: Access denied to certain operations unless SUID binary is neutralized.
> SOLUTION: `find / -perm -4000` -> `chmod u-s /usr/bin/backdoor`.
> ENCRYPTION: LOW

[2026-02-14 06:58]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Swap Space" (Cycle 139).
> MECHANICS: Added `/dev/sdb2` (RAW_PARTITION) and OOM Killer log.
> COMMANDS: `mkswap` (Format partition), `swapon` (Enable swap), `free` (Display memory).
> CONSTRAINT: System running out of RAM (Simulated OOM in dmesg).
> SOLUTION: `mkswap /dev/sdb2` -> `swapon /dev/sdb2`.
> ENCRYPTION: LOW
