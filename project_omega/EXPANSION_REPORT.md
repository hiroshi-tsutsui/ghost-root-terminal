# Project Omega Expansion Report

## Accomplishments
- **Restructured Application**: Converted the single-page app into a multi-page platform using Next.js App Router.
- **Implemented Vectors (Math B)**:
  - Added full 3D visualization using `react-three-fiber` and `three.js`.
  - Features: 3D vector arrows, interactive X/Y/Z inputs, real-time Dot Product & Cross Product calculation, and dynamic angle display.
- **Implemented Calculus (Math III)**:
  - Created an interactive 2D canvas visualizer for `f(x) = 0.5x^3 - 2x`.
  - Features: Dynamic Tangent Line (Derivative) visualization and Area Under Curve (Integral) calculation/shading.
- **Implemented Probability (Math A)**:
  - Created an interactive Normal Distribution (Bell Curve) visualizer.
  - Features: Adjustable Mean (μ) and Standard Deviation (σ), with visual shading for the standard deviation range.
- **Migrated Quadratics (Math I)**: Moved original quadratic function visualizer to its own dedicated section.
- **New Landing Page**: Created a modern dashboard to navigate between all 4 math modules.

## Technical Details
- **Dependencies**: Added `three`, `@react-three/fiber`, `@react-three/drei`.
- **Installation**: Use `npm install --legacy-peer-deps` due to React 19 / R3F compatibility.
- **Structure**:
  - `app/page.tsx` (Landing)
  - `app/vectors/` (New)
  - `app/calculus/` (New)
  - `app/probability/` (New)
  - `app/quadratics/` (Refactored)

## Next Steps
- Deploy to Vercel (push to main).
- Add more complex functions to Calculus (user input for custom functions).
- Add "Balls in Bins" simulation for Probability.

## Ready for Review
The local codebase in `project_omega/` is updated and ready to run.
