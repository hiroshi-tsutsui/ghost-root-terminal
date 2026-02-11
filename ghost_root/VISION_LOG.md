
[2026-02-11 14:45]
> CHANGES: ghost_root/web/lib/Shell.ts, ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Environment Variable" (env / export / printenv).
> MECHANICS: Added `uplink_connect` command that checks `ENV_VARS`. Added `/etc/uplink.conf` hint file.
> LORE: The satellite uplink protocol requires a session key (`UPLINK_KEY`) to be set in the environment, preventing accidental transmission.
> SOLUTION: `uplink_connect` (fails) -> `cat /etc/uplink.conf` (read instructions) -> `export UPLINK_KEY=XJ9-SAT-442` -> `uplink_connect` (success).
