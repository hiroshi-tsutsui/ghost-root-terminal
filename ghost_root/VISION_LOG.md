
[2026-02-11 17:30]
> CHANGES: ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Broken Archive" (Base64 Zip / File Recovery).
> MECHANICS: Added `/home/ghost/backup.zip.b64` (corrupted/encoded).
> LORE: A backup file was transferred as raw base64 but never decoded. It contains a "confidential" PDF.
> SOLUTION: `base64 -d backup.zip.b64 > backup.zip` -> `unzip backup.zip` -> `cat confidential.txt`.
