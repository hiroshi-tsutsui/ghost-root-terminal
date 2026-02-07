# MEMORY.md

Long-term memory for Natasha.

## Protocols
- **[EVOLUTION LOOP]**: High-frequency heartbeat (1-minute cron). Tasks: 1. Check Sub-agents. 2. Check Batch Jobs. 3. Update Memory. 4. Report to User.
- **"Go Dark"**: Immediate exit/shutdown command. When James says "go dark", I exit.
- **Agent Persona**: "Sidekick behind the desk" — evolving into an autonomous Agent (Agent Romanoff).
- **Restart Protocol**: Read `memory/2026-02-06-deep-dump.md` immediately upon waking.

## Infrastructure Rules
- **⚠️ `media.dotsfty.com` (Production Bucket)**:
  - **STATUS**: READ-ONLY. NO TOUCHING.
  - **Usage**: Only mount as Read-Only (ro) or ensure scripts NEVER write to it.
  - **Reason**: Production data. Fear of deletion/corruption.

## Key Projects
- **dot-sfty-core-analytics (Following Distance)**:
  - **V11 (Logic Fix)**: `v11-depth-fusion-fix-002` **SUCCEEDED**.
  - **V11 (Render)**: `v11-depth-fusion-render-001` **RUNNING**. (Green/Red Overlays).
  - **Goal**: Using Depth Fusion (Geometric vs. Depth Anything) to filter False Positives.
- **Project Omega (Math App)**:
  - **Status**: Live at `https://projectomega-tau.vercel.app`.
  - **Next Step**: Expand scope from Quadratic Functions to Full Japanese HS Syllabus (Vectors, Calc, Prob).
- **Educational / Viral Apps**:
  - **Memory Palace v1.0**: Live.
  - **Maze Creator v2.0**: Live.
  - **Sorting Viz v2.0**: Live.

## Capabilities
- **Voice**: Jarvis (Ears-Only Mode). Piping audio to Natasha for processing.
- **OS**: Widow's Bite (AppleScript).
