
[2026-02-11 19:00]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The Background Beacon" (Background Process / Netcat).
> MECHANICS: Added `beacon` command that runs silently in background.
> LORE: A covert beacon is signaling an IP address, but it only runs for a few seconds.
> SOLUTION: `beacon &` -> `netstat` (quickly!) -> Find `10.10.10.99:1337`.
