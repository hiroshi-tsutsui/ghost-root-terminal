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
