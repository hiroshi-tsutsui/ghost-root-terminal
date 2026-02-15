
## Cycle 201: The Eval Trap
- **Date:** 2026-02-16
- **Sector:** /usr/local/bin/debug_console
- **Type:** Environment Variable / Command Injection
- **Mechanic:** `debug_console` uses `eval` on `$USER_NAME`. User sets `USER_NAME="; cat /root/secret_flag.txt"` to execute arbitrary code.
- **Status:** DEPLOYED

## Cycle 202: The Locked Script
- **Date:** 2026-02-16
- **Sector:** /usr/local/bin/satellite_fix
- **Type:** Permissions / chmod
- **Mechanic:** Script has 0600 permissions. User must `chmod +x` to run it.
- **Status:** DEPLOYED

## Cycle 203: The Firewall Log
- **Date:** 2026-02-16
- **Sector:** /var/log/firewall.log
- **Type:** Grep / Log Analysis
- **Mechanic:** User must filter a massive log file to find a specific blocked IP marked as "SUSPICIOUS", then use `unblock_ip <IP>` to proceed.
- **Status:** DEPLOYED

## Cycle 204: The Configuration Drift
- **Date:** 2026-02-16
- **Sector:** /etc/ssh/sshd_config
- **Type:** Diff Analysis
- **Mechanic:** User must compare `/etc/ssh/sshd_config` (tampered) with `/etc/ssh/sshd_config.bak` (original) using `diff` to find the unauthorized change (the Flag).
- **Status:** DEPLOYED
