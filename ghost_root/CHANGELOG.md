# CHANGELOG

### Added
- Implemented `radio` command (SDR simulation): Scan FM frequencies and decode Morse code (`89.9 MHz`).
- Added hint in `/var/log/syslog` about radio interference.
- Fixed `Shell.ts` to include `radio` in `COMMANDS` list.

## [Released] - 2026-02-09 (Vision Update)
### Added
- Implemented `steghide` extraction (Puzzle: Extract hidden data from `evidence.jpg` using passphrase).
- Added `diff` command for file comparison.
- Added `tree` command for directory visualization.
- Added `neofetch` for system branding.
- Added `weather` command (Simulated).

## [Released] - 2026-02-09 (Earlier)
### Added
- Implemented `whois` command with lore and hints.
- Added hidden file `.auth.key` in `.cache` directory as a red herring.
- Updated `VFS.ts` with new file content and structure.
- Updated `Shell.ts` to support `whois` command.

### Changed
- Improved `help` command output.
