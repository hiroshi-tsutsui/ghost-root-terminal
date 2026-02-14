[2026-02-14 21:00]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The LD_PRELOAD Injection" (Cycle 154).
> MECHANICS: Added `/usr/lib/libmon.so`, `ENV_VARS['LD_PRELOAD']`, `unset` command.
> COMMANDS: Added `unset`. Fixed `export` (supports clearing). Updated `processCommand` to intercept calls.
> CONSTRAINT: Critical commands (`ssh`, `deploy_tool`, `sat`, etc.) are blocked by monitoring policy if `LD_PRELOAD` is active.
> SOLUTION: `unset LD_PRELOAD` or `export LD_PRELOAD=`.
> ENCRYPTION: LOW

[2026-02-14 21:30]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Broken Pipe" (Cycle 155).
> MECHANICS: Added `/usr/bin/data_processor`, `pipeline_error.log`.
> COMMANDS: `data_processor` now checks for STDIN.
> CONSTRAINT: Command fails if run directly. Requires data stream.
> SOLUTION: `echo "ANY_DATA" | data_processor`.
> ENCRYPTION: LOW
