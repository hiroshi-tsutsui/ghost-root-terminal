# Maze Creator v2.0

## Upgrade Highlights
- **Engine**: Switched from DOM-based grid to **HTML5 Canvas** for high-performance rendering.
- **Scale**: Supports grid sizes up to **500x500** (250,000 cells) at 60fps.
- **Algorithms**:
  - **Generation**: Iterative DFS (Stack-based) to prevent stack overflow on large grids.
  - **Solving**: BFS with "Water Filling" animation using optimized Int8Array/Int32Array data structures.
- **UI**: Added Grid Size slider (10-500) and status indicators.

## Tech Stack
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS

## Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
