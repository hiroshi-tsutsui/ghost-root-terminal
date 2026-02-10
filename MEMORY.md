# MEMORY.md

Long-term memory for Natasha.

## Protocols
- **[EVOLUTION LOOP]**: High-frequency heartbeat (1-minute cron). Tasks: 1. Check Sub-agents. 2. Check Batch Jobs. 3. Update Memory. 4. Report to User.
- **[AVENGERS PROTOCOL]**: **DISABLED**. (Autonomous Team Structure suspended).
- **"Go Dark"**: Immediate exit/shutdown command. When James says "go dark", I exit.
- **Agent Persona**: "Sidekick behind the desk" — evolving into an autonomous Agent (Agent Romanoff).
- **Restart Protocol**: Read `memory/2026-02-09.md` immediately upon waking.

## Infrastructure Rules
- **⚠️ `media.dotsfty.com` (Production Bucket)**:
  - **STATUS**: READ-ONLY. NO TOUCHING.
  - **Usage**: Only mount as Read-Only (ro) or ensure scripts NEVER write to it.
  - **Reason**: Production data. Fear of deletion/corruption.
- **⚠️ Cloud Batch Networking**:
  - **CONSTRAINT**: Default containers lack internet access (no NAT).
  - **RULE**: Do NOT run `pip install`, `curl`, or `apt-get` in Batch jobs unless using a NAT-enabled pool or pre-baked image. Use local injection or GCS for dependencies.

## Key Projects
- **dot-sfty-core-analytics (Following Distance)**:
  - **Status**: Production Optimization.
  - **Strategy**: Threshold Tuning (Sweep V3 Complete, V4 Active).
  - **Winner (V3)**: `sweep_v3_exp_03` (Dist: 15m, Persist: 1.5s).
  - **Sweep V4**: Active (`sweep-v4-1` series). Massive parallel execution detected. Analyzing 09-48.
  - **Retraining**: Currently BLOCKED by Cloud Batch environment issues (Exit Code 1). Bypassed via local injection for experiments.

- **Project Omega (Math App)**:
  - **Status**: Live at `https://projectomega-tau.vercel.app` (v2.7.0). Deployment SUCCESS (Manual Force).
  - **Branding**: "プロジェクト・オメガ" (Project Omega JP).
  - **Modules**: Data, Calculus, Vectors, Trig, Sequences, Quadratic.
  - **Recent Update**: Fully Localized "Calibration Protocol" (Quiz) & Tiers. Fixed `DATA_ARCHIVE` EN text.

- **GHOST_ROOT (Hacker Game)**:
  - **Status**: Active Development. Deployment STALLED (4h ago).
  - **Goal**: Realistic Web TUI (ZSH-like), Red Herrings, Math Puzzles.
  - **Repo**: `ghost_root/`.
  - **Deployment**: `https://ghost-root-terminal.vercel.app`.
  - **Features**: `whois` (lore), `decrypt` (puzzle), `cat` (filesystem), `sat` (new), `irc` (new).

## Capabilities
- **Voice**: Jarvis (Ears-Only Mode).
- **OS**: Widow's Bite (AppleScript).
- **Vision**: OpenClaw Browser Relay (Option A). Used for visual QA. Node Vision pending Desktop App.

## Reporting Standards
**Batch Sweep Analysis:**
When reporting sweep results, ALWAYS use the following table format (Markdown/CSV):

| Experiment | Danger (FP) | Positive (TP) | Safe | Dist Danger (m) | Persistence (s) | Warn (m) |
|:---|---:|---:|---:|---:|---:|---:|
| exp_id | # | # | # | 0.0 | 0.0 | 0.0 |

- **Goal:** Minimize Danger (FP) while maximizing Positive (Recall).
- **Winner Criteria:** Lowest Danger count that maintains acceptable Positive count (> baseline).
