# MEMORY.md

Long-term memory for Natasha.

## Protocols
- **[EVOLUTION LOOP]**: High-frequency heartbeat (1-minute cron). Tasks: 1. Check Sub-agents. 2. Check Batch Jobs. 3. Update Memory. 4. Report to User.
- **"Go Dark"**: Immediate exit/shutdown command. When James says "go dark", I exit.
- **Agent Persona**: "Sidekick behind the desk" — evolving into an autonomous Agent (Agent Romanoff).
- **Restart Protocol**: Read `memory/2026-02-08.md` immediately upon waking.

## Infrastructure Rules
- **⚠️ `media.dotsfty.com` (Production Bucket)**:
  - **STATUS**: READ-ONLY. NO TOUCHING.
  - **Usage**: Only mount as Read-Only (ro) or ensure scripts NEVER write to it.
  - **Reason**: Production data. Fear of deletion/corruption.

## Key Projects
- **dot-sfty-core-analytics (Following Distance)**:
  - **V11-V16 (Depth Fusion)**: **ABANDONED**. User rejected complexity/utility.
  - **Option B (Classifier)**: **REJECTED**. User prefers single-model simplicity.
  - **Option C (Retraining)**: **APPROVED**.
    - **Method**: Hard Negative Mining (teach model to ignore ghosts).
    - **Execution**: NO LOCAL DOWNLOAD. Run directly on Cloud Batch using existing GCS videos.
    - **Input Path**: `gs://yolo-gcp/eagle/infer/input/labeled/following_distance_fp_Jan19_Feb5/`.

- **Project Omega (Math App)**:
  - **Status**: Live at `https://projectomega-tau.vercel.app` (Last Sync: 2026-02-08 16:55 JST).
  - **Phase 2**: "The Awakening" (Narrative/Game Layer).
  - **Core Narrative**: "Reach Omega Status" -> "Void Bleed".
  - **Modules**: Data (Localized), Calculus (Localized - Flux Engine Ready), Vectors (Localized - Void Scout Ready), Trig (Localized - Harmonic Tuner Ready), Sequences (Localized - Chronos Pattern Ready).
  - **Active Agent**: **Tony** (The Architect).

## Capabilities
- **Voice**: Jarvis (Ears-Only Mode).
- **OS**: Widow's Bite (AppleScript).
- **Vision**: OpenClaw Browser Relay (Option A). Used for visual QA. Node Vision pending Desktop App.

## Avengers Protocol
- **Natasha**: Main Agent.
- **Tony**: Engineer (Director/Architect).
- **Wanda**: Designer (UI/UX).
- **Hawkeye**: Overseer (Monitoring).
- **Pepper**: Operations (Deployment/Sync).
