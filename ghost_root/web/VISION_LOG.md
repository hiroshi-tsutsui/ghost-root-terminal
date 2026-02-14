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
