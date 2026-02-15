[2026-02-15 09:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 174: The Process Killer".
> MECHANICS: Added `rogue_agent` (PID 7000) and `data_siphon` (PID 7001). Implemented respawn logic in `kill`.
> COMMANDS: `kill`, `ps`, `rogue_agent`.
> SCENARIO: User sees high network traffic alert. Killing the child process (`data_siphon`) causes immediate respawn. User must identify the parent (`rogue_agent`) via PPID and terminate it to stop the cycle.
> ENCRYPTION: LOW

[2026-02-15 10:15]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 175: Manual Override".
> MECHANICS: Added `/usr/local/bin/restore_uplink` (script) and `uplink_connect_manual` (binary).
> COMMANDS: `restore_uplink`, `uplink_connect_manual`.
> SCENARIO: User runs `restore_uplink`, it crashes with "Segmentation fault". User must `cat` the script to find the manual override instructions (set ENV `UPLINK_KEY=OMEGA-99-ZETA` and run `uplink_connect_manual`).
> ENCRYPTION: LOW

[2026-02-15 10:45]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 180: The Env Var Trap".
> MECHANICS: Added `/usr/local/bin/nuclear_launch` (binary) and hidden `/home/ghost/.cache/notes_backup.txt`.
> COMMANDS: `nuclear_launch`, `cat`, `export`.
> SCENARIO: User finds `nuclear_launch` binary. Running it requires `LAUNCH_KEY` env var. User must find the key (`DELTA-9-FORCE`) in a hidden backup file in `.cache` and export it before running the binary.
> ENCRYPTION: MEDIUM

[2026-02-15 11:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 181: The Intrusion Log".
> MECHANICS: Added `/var/log/intrusion.log` (log file) and `/usr/local/bin/trace_intruder.sh` (script).
> COMMANDS: `grep`, `chmod`, `trace_intruder.sh`.
> SCENARIO: User gets alert about intrusion. Must `grep` the huge log file for "CRITICAL" to find the IP `45.33.22.11`. Then run `trace_intruder.sh <IP>`, but first fix its permissions (`chmod +x`) as it is non-executable by default.
> ENCRYPTION: HIGH

[2026-02-15 12:05]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 182: The SSH Key Permission".
> MECHANICS: Added `/home/ghost/.ssh/id_bunker` (0644 perms) and `ssh` logic for `192.168.1.150`.
> COMMANDS: `chmod`, `ssh`, `ls -l`.
> SCENARIO: User finds key in `.ssh` but it has bad permissions (0644). SSH rejects it ("Permissions 0644 are too open"). User must run `chmod 600` on the key to use it.
> ENCRYPTION: MEDIUM

[2026-02-15 12:40]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "Cycle 183: The Log Rotation".
> MECHANICS: Added `/var/log/syslog_full` (huge file) and `/usr/local/bin/rotate_logs` (binary).
> COMMANDS: `rotate_logs`, `grep`, `tail`.
> SCENARIO: User gets alert about full logs. Must `grep` the huge log file for "ARCHIVE_DAEMON" to find the key `GHOST_ROOT{GR3P_TH3_N33DL3_V2}`. Then run `rotate_logs <KEY>` to clear it.
> ENCRYPTION: LOW

[2026-02-15 13:10]
> CHANGES: ghost_root/web/lib/Shell.ts, ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "Cycle 184: The Hidden Service".
> MECHANICS: Added `/usr/local/bin/dark_node` (non-executable) and `/home/ghost/service_log.txt` (hint).
> COMMANDS: `chmod`, `export`, `dark_node`.
> SCENARIO: User finds `dark_node` but it has 0644 permissions. Running it gives "Permission denied". Fixing permissions reveals it needs `DARK_MODE=1` env var. Setting env var grants access.
> ENCRYPTION: LOW
