
[2026-02-11 19:30]
> CHANGES: ghost_root/web/lib/VFS.ts
> PUZZLE ADDED: "The Corrupt File System" (fsck / fsck.ext4 / Recovery).
> MECHANICS: Added `fsck` command. `/dev/sdb1` is marked as dirty.
> LORE: A critical partition (`/dev/sdb1`) has filesystem errors and refuses to mount fully.
> SOLUTION: `mount` (error) -> `fsck /dev/sdb1` (interactive repair) -> `mount /dev/sdb1 /mnt` -> Flag recovered.
