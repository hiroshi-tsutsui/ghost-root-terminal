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

[2026-02-13 01:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Scheduled Task" (Cycle 93).
> MECHANICS: Added `/etc/cron.d/malware` causing high CPU load.
> CONSTRAINT: Malware respawns or persists.
> SOLUTION: Find the malicious cron job and `rm /etc/cron.d/malware`.
> ENCRYPTION: LOW

[2026-02-13 01:58]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Deleted File" (Cycle 94).
> MECHANICS: Added deleted config file held by process 8888.
> CONSTRAINT: File `/home/ghost/secret.conf` is deleted but open.
> SOLUTION: Check `lsof -p 8888` (fd 3) then `cp /proc/8888/fd/3 recovered.conf`.
> ENCRYPTION: LOW

[2026-02-13 02:34]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The World-Writable Cron" (Cycle 98).
> MECHANICS: Added /etc/cron.d (777) + systemctl cron check.
> CONSTRAINT: User must create a job to copy /root/flag.txt to /tmp.
> SOLUTION: echo "* * * * * root cp /root/flag.txt /tmp/flag" > /etc/cron.d/pwn; systemctl restart cron
> ENCRYPTION: LOW

[2026-02-13 03:20]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Disk Quota" (Cycle 99).
> MECHANICS: Added 50GB file `/var/log/syslog.1` filling `/var`.
> CONSTRAINT: Write operations to `/var` or `/home` fail ("No space left on device").
> SOLUTION: `du -h /var` to find the culprit, then `rm /var/log/syslog.1`.
> ENCRYPTION: LOW

[2026-02-13 03:59]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Inode Exhaustion" (Cycle 100).
> MECHANICS: Added `/var/cache/inodes_fill` directory causing 100% Inode Usage.
> CONSTRAINT: File creation (`touch`, `mkdir`, `echo >`) fails with "No space left on device".
> SOLUTION: `df -i` to diagnose, then `rm -rf /var/cache/inodes_fill`.
> ENCRYPTION: LOW
