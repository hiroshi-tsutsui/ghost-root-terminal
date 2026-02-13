# VISION LOG

[2026-02-13 08:35]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Alias Trap" (Cycle 107).
> MECHANICS: Aliased `ls` to a fake error message. Added `system_alert.log` hint.
> COMMANDS: Updated `unalias` to detect puzzle solution.
> CONSTRAINT: User sees "File System Corrupted" on `ls`.
> SOLUTION: `type ls` or `alias` -> `unalias ls`.
> ENCRYPTION: LOW

[2026-02-13 08:52]
> CHANGES: ghost_root/web/lib/Shell.ts, ghost_root/web/components/Terminal.tsx
> PUZZLE ADDED: "The Background Job" (Cycle 108).
> MECHANICS: Annoying broadcast message disrupts terminal every 10 seconds.
> COMMANDS: `ps`, `kill`. Updated `kill` to handle rogue PID 6666.
> CONSTRAINT: User is spammed with "[BROADCAST] SYSTEM COMPROMISED".
> SOLUTION: `ps` to find PID, `kill 6666`.
> ENCRYPTION: LOW

[2026-02-13 09:14]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Hidden Environment" (Cycle 109).
> MECHANICS: Added `SAFETY_LOCK` environment variable logic.
> COMMANDS: Added `/usr/bin/launch_missile`.
> CONSTRAINT: User must override `SAFETY_LOCK` via `export`.
> SOLUTION: `export SAFETY_LOCK=disengaged` -> `launch_missile`.
> ENCRYPTION: LOW

[2026-02-13 10:55]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Broken Service" (Cycle 110).
> MECHANICS: Added `systemctl` logic for `web_server`. Missing config file prevents start.
> COMMANDS: `systemctl status web_server`, `systemctl start web_server`, `cp`.
> CONSTRAINT: Service fails to start with "exit-code 1".
> SOLUTION: Check status -> Read logs -> `cp /usr/share/doc/web_server/config.json.example /etc/web/config.json` -> `systemctl start web_server`.
> ENCRYPTION: LOW
