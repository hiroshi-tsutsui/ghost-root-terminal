# Ghost Root

A realistic browser-based hacker terminal simulation.

## Status
- **Web Version**: [Live Demo](https://ghost-root-terminal.vercel.app)
- **CLI Version**: (Legacy) `npm start` in root.

## Recent Updates (2026-02-09)
- **Core:** Added `su` command for user switching (`ghost` -> `admin` -> `root`).
- **Core:** Updated `whoami` to reflect current user context.
- **Lore:** Expanded `whois` database (Omega, Vision, Natasha).
- **Tooling:** Implemented `grep` for file analysis.
- **Security:** Added mock password protection for `su`.

## Roadmap
- [ ] Implement filesystem persistence (localStorage?).
- [ ] Add `ssh` mock servers beyond simple stubs.
- [ ] Create a multi-stage "Decryption" puzzle.
