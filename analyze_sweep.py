import json
import os
import subprocess
import glob

# Create local dir
local_output_dir = "sweep_results"
os.makedirs(local_output_dir, exist_ok=True)

# Download all results
# gs://yolo-gcp/eagle/infer/output/sweep_v2/sweep_v1_exp_*/result.json
print("Downloading sweep results...")
try:
    subprocess.check_call(["gsutil", "-m", "cp", "-r", "gs://yolo-gcp/eagle/infer/output/sweep_v2/*", local_output_dir])
except Exception as e:
    print(f"Download warning: {e}")

# Analyze
results = []
# Structure in GCS: sweep_v2/sweep_v1_exp_XX/result.json
# Structure locally: sweep_results/sweep_v1_exp_XX/result.json

exp_dirs = glob.glob(os.path.join(local_output_dir, "sweep_v1_exp_*"))
print(f"Found {len(exp_dirs)} experiment directories.")

best_exp = None
# Objective: Maximize Recall (Positive Detection) while minimizing False Positives (Danger) in this specific dataset?
# Actually, the user wants "best values".
# The dataset is `following_distance_fp_Jan19_Feb5`. This is a False Positive dataset (mostly Safe videos identified as Danger previously).
# So, we want to MINIMIZE "danger" counts here. Ideally 0.
# Any "danger" detection here is likely a False Positive (unless there are true positives mixed in, which 'fp' implies there shouldn't be, or very few).
# But wait, there is also `following_distance_infer_threshold_tp_v1`.
# Ideally I should have run the sweep on BOTH FP and TP datasets to balance Precision vs Recall.
# But I only ran it on the FP dataset (`following_distance_fp_Jan19_Feb5`).
# So for this sweep, the best model is the one with the LOWEST "danger" count.
# However, if we make it too strict, we kill True Positives.
# Since I don't have TP results for this sweep, I can only optimize for FP reduction.
# But I can check which config reduces FP the most without going to extreme/absurd values.

min_danger = 999999

summary_data = []

for d in exp_dirs:
    json_path = os.path.join(d, "result.json")
    if not os.path.exists(json_path):
        print(f"Missing result for {d}")
        continue
        
    try:
        with open(json_path, "r") as f:
            data = json.load(f)
            # Recover config from environment or filename mapping if possible
            # But the result.json I wrote only has counts.
            # I need to map exp_id to params.
            exp_id = os.path.basename(d)
            
            danger_count = data.get("danger", 0)
            
            summary_data.append({
                "id": exp_id,
                "danger": danger_count,
                "safe": data.get("safe", 0),
                "positive": data.get("positive", 0)
            })
            
            if danger_count < min_danger:
                min_danger = danger_count
                best_exp = exp_id
    except Exception as e:
        print(f"Error reading {json_path}: {e}")

# Load param mapping
with open("sweep_experiments.json", "r") as f:
    experiments = json.load(f)
    param_map = {e["id"].replace("_", "-"): e["params"] for e in experiments} 
    # Wait, my exp_id generation in generate_sweep.py used underscores: `sweep_v1_exp_{i+1:02d}`
    # But job submission used dashes for job name.
    # The output path in submit_sweep.py used underscores: `f"yolo-gcp/eagle/infer/output/sweep_v1/{exp_id}/"`
    # So the folder names have underscores.
    
    param_map_underscore = {e["id"]: e["params"] for e in experiments}

print(f"Best Experiment (Lowest FP) on FP Dataset: {best_exp}")
print(f"Min Danger Count: {min_danger}")

if best_exp and best_exp in param_map_underscore:
    print("Best Params:", param_map_underscore[best_exp])

# Save summary
with open("sweep_analysis.json", "w") as f:
    json.dump(summary_data, f, indent=2)
