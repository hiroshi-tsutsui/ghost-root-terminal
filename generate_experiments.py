import json
import itertools
import os

# Hyperparameter Grid
# Strategy: Fine-grained search around the baseline (15m/0.6s) and the strict experiment (12m/0.8s).
# We want to recover Recall (>70%) while keeping FP as low as possible.

param_grid = {
    "DIST_DANGER_M": [13.0, 13.5, 14.0, 14.5],  # 15.0 was baseline, 12.0 was too strict.
    "DANGER_PERSISTENCE_SEC": [0.6, 0.7, 0.8], # 0.6 was baseline, 0.8 was strict.
    "EMA_ALPHA": [0.3, 0.5], # Smoothing factor (0.3 baseline). Higher = faster reaction but noisier.
}

# Generate combinations
experiments = []
keys = param_grid.keys()
combinations = list(itertools.product(*param_grid.values()))

for i, combo in enumerate(combinations):
    params = dict(zip(keys, combo))
    # Fixed params
    params["DIST_WARN_M"] = 30.0 # Keep this sensitivity high as it didn't seem to hurt.
    
    exp_id = f"exp_v{i+1:02d}"
    experiments.append({
        "id": exp_id,
        "params": params
    })

print(f"Generated {len(experiments)} experiments.")
with open("threshold_experiments.json", "w") as f:
    json.dump(experiments, f, indent=2)
