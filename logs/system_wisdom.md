# System Wisdom: Math Tactix Evolution

## 🧠 Architectural Principles
- **Sticky Visual Viewport**: Always keep the Math Canvas at the top of the mobile screen. Users must see the visual change immediately when adjusting sliders.
- **Story-Driven Learning**: 
  - Lesson 01: Shape (The $a$ coefficient)
  - Lesson 02: Position (The vertex secret)
  - Lesson 03: Translation (Completing the square)
  - Lesson 04: The Bridge (Why we do this)
  - Lesson 05: Tactics (Exam success)
- **Math Rigor**: Use KaTeX for all formulas. No `x^2`, use $\displaystyle x^2$.

## 🛠 Lessons Learned
- **Cycle 01 (Quadratics)**: Moving domains $[a, a+k]$ require clear visualization of the "boundary" where the max/min flips. Highlighting the text based on the axis position relative to the box is key.
- **Cycle 02 (Trigonometry)**: The unit circle should clearly map $\cos$ to width (blue) and $\sin$ to height (red). Visual bars on axes help bridge the gap between circle coordinates and numerical values.
- **Cycle 03 (Trigonometry)**: "Famous Angles" (30, 45, 60...) are the tactical foundation of Trig. Implementing a "magnetic snap" on the slider and showing exact fractional values ($\frac{\sqrt{3}}{2}$) converts visual rote-learning into intuitive spatial memory.
- **Cycle 04 (Inequalities)**: Shading regions ($y>0$ vs $y<0$) visually connects the algebraic inequality to the graph's position relative to the x-axis. Using amber for "danger/inside" ($<0$) and green for "safe/outside" ($>0$) creates an intuitive emotional mapping.
- **Cycle 05 (Inequalities Refinement)**: 
  - **Interval Lines**: Drawing thick colored lines on the x-axis bridges the gap between the 2D region and the 1D solution set.
  - **Endpoint Rigor**: Visualizing the difference between `>` (Hollow Circle) and `>=` (Filled Circle) is critical for exam precision. Students often lose points here.

## 🚫 Avoid List
- **Path Ambiguity**: When working in a multi-directory repo, always use absolute paths for file writes to ensure the correct Next.js project is updated.
- **Never repeat these mistakes**:
  - Don't name components `Math` (conflicts with JS global). Use `MathComponent`.
  - Don't assume `git push` triggers Vercel instantly without verifying the build status.
  - Don't use raw markdown for bold text in UI; use styled Tailwind components.
  - Never miss `lucide-react` imports.

## 🚀 Future Roadmap
- [x] Famous Angle Snapping for Trig (30/45/60).
- [x] Fractional values for Trig ($\frac{1}{2}$, $\frac{\sqrt{3}}{2}$).
- [x] Quadratic Inequalities (Static Prototype).
- [x] Quadratic Inequalities (Dynamic - Move Parabola).
- [x] Quadratic Inequalities (Strict vs Inclusive Logic).
- [ ] Sine/Cosine Theorem Tactical Engine.
- [ ] Level 6: Graph Transformation (Parallel translation).
