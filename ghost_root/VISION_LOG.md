[2026-02-14 11:20]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Expired Certificate" (Cycle 147).
> MECHANICS: Added `/usr/bin/secure_connect` (checks SYSTEM_TIME_OFFSET). Added `/home/ghost/ssl_error.log`.
> COMMANDS: Updated `date` (support `-s` for root). Updated `curl` (check certificate expiry vs time).
> CONSTRAINT: `curl secure.ghost.network` fails with "Certificate Expired". System time is 2026.
> SOLUTION: `su` -> `date -s "2024-01-01"` -> `exit` -> `curl secure.ghost.network`.
> ENCRYPTION: LOW

[2026-02-14 12:20]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Hostname Mismatch" (Cycle 148).
> MECHANICS: Added `/usr/bin/verify_host`, `/proc/sys/kernel/hostname`, `/etc/hostname`.
> COMMANDS: Added `hostname` (read/write logic). Added `verify_host` verification logic.
> CONSTRAINT: `verify_host` fails if hostname is "ghost-root". Requires "secure-node-alpha".
> SOLUTION: `su` -> `hostname secure-node-alpha` -> `verify_host`.
> ENCRYPTION: LOW

[2026-02-14 12:50]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Runlevel Change" (Cycle 149).
> MECHANICS: Added `/etc/inittab`, `/sbin/init`, `init`, `telinit`, `runlevel`.
> CONSTRAINT: System boots into Runlevel 1 (Single User Mode). Network commands (ssh, curl, nmap, etc.) are disabled.
> SOLUTION: Read `/home/ghost/maintenance.log` -> Run `init 3` to switch to Multi-User Mode -> Network restored.
> ENCRYPTION: MED

[2026-02-14 13:45]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Encrypted Partition" (Cycle 150).
> MECHANICS: Added `/dev/sdb1` (LUKS), `cryptsetup`, `mount`, `umount`.
> COMMANDS: Added `cryptsetup luksOpen` logic and `mount` for `/dev/mapper`.
> CONSTRAINT: `/dev/sdb1` cannot be mounted directly (unknown filesystem).
> SOLUTION: `cryptsetup luksOpen /dev/sdb1 secure --passphrase ghost_protocol_v4` -> `mount /dev/mapper/secure /mnt/secure`.
> ENCRYPTION: HIGH

[2026-02-14 14:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Missing Shared Object" (Cycle 151).
> MECHANICS: Added `/usr/bin/decipher` (missing lib), `/opt/ghost/libs/libcrypto_ghost.so`.
> COMMANDS: Added `ldd` simulation. Added `decipher` execution logic (requires `LD_LIBRARY_PATH`).
> CONSTRAINT: `decipher` fails with "error while loading shared libraries" unless correct path is exported.
> SOLUTION: `ldd /usr/bin/decipher` -> `export LD_LIBRARY_PATH=/opt/ghost/libs` -> `decipher`.
> ENCRYPTION: MED

[2026-02-14 14:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Degraded RAID" (Cycle 152).
> MECHANICS: Added `/proc/mdstat`, `/dev/md0`, `/dev/sdb1` (failed), `/dev/sdd1` (spare).
> COMMANDS: Added `mdadm` (simulate --detail, --manage, --remove, --add).
> CONSTRAINT: Array is degraded.
> SOLUTION: `mdadm --manage /dev/md0 --remove /dev/sdb1` -> `mdadm --manage /dev/md0 --add /dev/sdd1`.
> ENCRYPTION: LOW
