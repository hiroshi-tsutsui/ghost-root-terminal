# VISION LOG

## Cycle 148: The SUID Path Injection
- **Date:** 2026-02-14
- **Sector:** /usr/bin/backup_manager
- **Type:** SUID / PATH Injection
- **Description:** Added a SUID root binary `backup_manager` that calls `tar` without an absolute path. Users must create a malicious `tar` script and manipulate their PATH to escalate privileges and read `/root/flag.txt`.

## Cycle 165: The Umask Mystery
- **Date:** 2026-02-15
- **Sector:** /usr/bin/secure_generator
- **Type:** Permissions / Umask
- **Description:** Added `umask` command simulation and `secure_generator` tool. The tool creates a key file using the current umask. Default umask (0022) results in insecure permissions (0644). User must set `umask 0077` to force 0600 permissions and pass the security check.

## Cycle 172: The Manual Page
- **Date:** 2026-02-15
- **Sector:** /usr/bin/net-splice
- **Type:** RTFM (Man Page Analysis)
- **Description:** Added `net-splice`, a tool that requires specific arguments documented only in its man page (`man net-splice`). The user must read the documentation to discover the target IP (10.10.99.5), port (443), and stealth mode (silent) required to establish a covert channel.

## Cycle 181: The Broken Installer
- **Date:** 2026-02-15
- **Sector:** /usr/local/bin/install_patch.sh
- **Type:** Corrupted Binary / Manual Patching
- **Description:** Added a corrupted shell script (`install_patch.sh`) that segfaults upon execution. The user must analyze the file content (`cat`), find the hidden manual override instructions (Set ENV `PATCH_LEVEL=9`), and execute the core patch tool (`patch_core --apply`) directly to secure the system.

## Cycle 130: The Path Hijack
- **Date:** 2026-02-15
- **Sector:** /usr/local/bin/sys_health
- **Type:** Sysadmin / PATH Injection
- **Description:** Added a vulnerable script `sys_health` that executes `diagnostic_tool` using a relative path. The user must manipulate the `PATH` environment variable to force the execution of a malicious `diagnostic_tool` located in their home directory instead of the system default.

## Cycle 207: The Silent Stream
- **Date:** 2026-02-16
- **Sector:** /usr/bin/covert_op
- **Type:** Redirection / File Descriptors
- **Mechanic:** Command detects if stdout is a TTY. Refuses to run unless output is redirected (e.g., `covert_op > file`).
- **Status:** DEPLOYED

## Cycle 224: The Corrupted Binary
- **Date:** 2026-02-16
- **Sector:** /usr/bin/sys_diag
- **Type:** Forensics / Strings Analysis
- **Mechanic:** Added `sys_diag` binary which segfaults on execution. Users must use the newly implemented `strings` command to extract the hidden flag from the binary file.
- **Status:** DEPLOYED

## Cycle 248: The DNS Poison
- **Date:** 2026-02-17
- **Sector:** /usr/bin/connect_secure
- **Type:** Sysadmin / DNS Spoofing
- **Mechanic:** `connect_secure` fails to resolve `secure.corp`. User must edit `/etc/hosts` to point `secure.corp` to `10.10.10.10`.
- **Status:** DEPLOYED
