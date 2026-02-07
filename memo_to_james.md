To: James (CPO)
From: CV Research
Re: Stack Audit - Rolling Stops & Distance

**Verdict: Functional but Brittle.** 
Using YOLO alone for these specific tasks is like trying to measure speed with a photograph. It works in ideal conditions but fails where it counts. We are likely seeing high false positives on stops and inconsistent distance data.

**The "Better Way"**

1. **For Rolling Stops: Add Temporal Context (Action Recognition)**
   *   **Current Issue:** YOLO sees frames, not time. It can't distinguish "slowly moving" from "stopped" robustly without complex, heuristic-heavy post-processing (tracking bounding box jitter).
   *   **Recommendation:** **VideoMAE V2** (or a lightweight **SlowFast** network).
   *   **Why:** We need a model that natively understands *motion* features, not just objects. A small 3D-CNN or Transformer processing a 16-frame buffer will definitively classify "rolling" vs. "stopped" by analyzing the optical flow signatures of the background, not just the car in front.

2. **For Following Distance: Monocular Depth Estimation (MDE)**
   *   **Current Issue:** Estimating distance from 2D bounding box height (perspective projection) is mathematically valid but practically flawed. It breaks on hills, different vehicle sizes (trucks vs. sedans), and curved roads.
   *   **Recommendation:** **Depth Anything V2** (or **Metric3D** if compute allows).
   *   **Why:** These models output a dense depth map from a single image. We can query the depth value of the center pixel of the vehicle's bounding box. This is significantly more robust to vehicle scale variances and road geometry than simple box geometry.

**Summary Proposal**
Don't rip out YOLO; it's great at finding *where* things are. But stop asking it to measure physics. 
*   **Pipeline:** YOLO (Detector) -> Crop -> Depth Head (Distance) + Temporal Head (Motion/Stop). 
*   **Trade-off:** slightly higher compute (latency), but massive reduction in false-positive "rolling stop" tickets and erratic distance warnings.

Let's discuss.
