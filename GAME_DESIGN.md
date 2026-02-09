# GAME_DESIGN.md

## Project GHOST_ROOT: The Awakening

**Target Deployment:** `https://ghost-root-terminal.vercel.app` (Vercel Project: `ghost-root-terminal`)
**Repository:** `ghost_root/`

**Concept:**
A dedicated Terminal/Hacker TUI game.
Current State: Node.js CLI (Ink).
Target State: **Web-based Terminal** (Next.js/React + xterm.js or equivalent) deployable to Vercel.

**Mission:**
Port the existing `ghost_root` (Ink-based CLI) logic to a Web App (`ghost_root/web`?) or refactor the root to be a Next.js app that *looks* like a terminal.

**Narrative:**
"The Awakening" - The user is a ghost in the machine.

**Vision's New Role:**
1.  **Analyze** the existing `ghost_root` logic (`index.js`, `src/`).
2.  **Port** it to a web-accessible format (Next.js) if it isn't already (Ink runs in Node, not browser).
    - *Correction:* The user provided a Vercel link, implying it might already be web-ready or needs to be made web-ready.
    - `ghost_root/package.json` shows "ink", which is CLI-only.
    - We likely need to create a `web/` frontend that mimics this behavior using a web terminal library.
3.  **Integrate** Math Puzzles as "Encryption Keys" or "Firewalls" within this terminal.

**Game Loop:**
1.  Boot -> Terminal Screen.
2.  `help` -> Shows commands.
3.  `connect omega_server` -> Triggers Math Puzzle (Visual Component).
4.  Solve Puzzle -> Access Granted -> Next Level.
