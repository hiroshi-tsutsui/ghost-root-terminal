# Hawkeye Batch Report - 2026-02-09

## 1. following-distance-infer-threshold-v1-annotate-fix
- **Status:** SUCCEEDED (Exit Code 0)
- **Duration:** ~45m
- **Output:** `gs://yolo-gcp/eagle/infer/output/labeled/following_distance_fp_Jan19_Feb5_v7_threshold_exp/`
- **Summary:**
  - Danger: 340
  - Positive: 93
  - Safe: 268
  - Total: 701
- **⚠️ CRITICAL ISSUE:** Although the job succeeded and produced a summary, the **video files are MISSING** from the output bucket. Only `batch_results_summary.json` exists. The script likely failed to write the video files to the mounted output directory, or they were written to a different location.

## 2. env-probe-v1
- **Status:** FAILED (Exit Code 1)
- **Reason:** Task failed during environment check.
- **Diagnosis:** The probe script failed, likely due to `grep` returning 1 (no match for `ultralytics|torch`) or `which` failing. However, since the main job ran successfully (code-wise), the environment seems functional for the actual task. The probe is likely too strict or broken.
