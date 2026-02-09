# Sweep V2 Results Analysis

Based on the summary CSV, here are the top performing configurations:

| Experiment | Danger (FP) | Safe (TN) | Positive (TP) | Configuration Details |
| :--- | :--- | :--- | :--- | :--- |
| **exp_27** | **522** (Highest) | 115 | 64 | **Danger Dist:** 16.0m, **Persist:** 0.7s, **Warn:** 30.0m |
| **exp_18** | **419** | 155 | 127 (High) | **Danger Dist:** 14.0m, **Persist:** 1.0s, **Warn:** 30.0m |
| **exp_20** | **518** (High) | 124 | 59 | **Danger Dist:** 15.0m, **Persist:** 0.6s, **Warn:** 30.0m |
| **exp_16** | **447** | 148 | 106 | **Danger Dist:** 14.0m, **Persist:** 0.8s, **Warn:** 30.0m |

### Observations

1.  **Sensitivity vs. Precision:**
    *   **Exp 27** (16m / 0.7s) is extremely sensitive (522 Danger detections) but likely has many False Positives given the lower Safe count (115) compared to others.
    *   **Exp 18** (14m / 1.0s) strikes a balanced profile. It has fewer Danger detections (419) but a higher Safe count (155) and significantly higher Positive count (127), suggesting better recovery detection.
    *   **Exp 20** (15m / 0.6s) is similar to Exp 27—very sensitive (low persistence, longer distance) but potentially noisy.

2.  **The "Sweet Spot" (Exp 18):**
    *   The user preferred **Exp 18**. This makes sense: the longer persistence (1.0s) filters out transient noise, and the 14m distance is conservative enough to avoid constant triggering while still catching real events.
    *   The high "Positive" count (127) indicates it successfully tracks the "Warning -> Recovery" lifecycle better than the hypersensitive models.

3.  **Sweep V3 Strategy (Confirmed):**
    *   We are now sweeping around Exp 18's values, as requested.
    *   **Danger Dist:** 15.0, 16.0, 18.0 (Pushing distance out, like Exp 27/20, but checking if higher persistence controls the noise).
    *   **Warn Dist:** 32.0, 35.0, 40.0 (Extending warning zone to see if it captures early approaches better).
    *   **Persistence:** 0.8, 1.2, 1.5 (Bracketing the 1.0s "sweet spot").

### Conclusion
Exp 18 is indeed the strongest candidate from V2 for a balanced "production" feel. The V3 sweep is correctly targeted to optimize this baseline.
