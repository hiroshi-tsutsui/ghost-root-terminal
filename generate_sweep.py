import json
import itertools

# Parameter Grid
grid = {
    "DIST_DANGER_M": [12.0, 13.0, 14.0, 15.0, 16.0], # 5 values
    "DANGER_PERSISTENCE_SEC": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], # 6 values
    "EMA_ALPHA": [0.3] # Fixed for now
}
# Total = 30 combinations.

experiments = []
keys = grid.keys()
combinations = list(itertools.product(*grid.values()))

for i, combo in enumerate(combinations):
    params = dict(zip(keys, combo))
    # Add fixed params
    params["DIST_WARN_M"] = 30.0
    
    exp_id = f"sweep_v1_exp_{i+1:02d}"
    experiments.append({
        "id": exp_id,
        "params": params
    })

with open("sweep_experiments.json", "w") as f:
    json.dump(experiments, f, indent=2)

print(f"Generated {len(experiments)} experiments.")
