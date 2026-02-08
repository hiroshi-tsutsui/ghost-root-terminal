# GHOST_ROOT Web Edition

This is the web-accessible version of the GHOST_ROOT game, built with Next.js and xterm.js.

## Running Locally

1. `cd ghost_root/web`
2. `npm install`
3. `npm run dev`

## Deployment

This project is ready for Vercel.
Ensure the root directory for Vercel is set to `ghost_root/web`.

## Architecture

- **Terminal.tsx**: The xterm.js interface component.
- **Shell.ts**: The game logic / command processor (agnostic of UI).
- **VFS.ts**: The virtual file system state.
