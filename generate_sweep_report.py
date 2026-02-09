import json
import os
import glob
import pandas as pd

# Paths
results_dir = os.path.expanduser("~/Downloads/yolo-gcp/eagle/infer/output/sweep_v3/")
# Updated: Look in current directory for configs
configs_dir = "." 

data = []

# Iterate through experiments 1-30
for i in range(1, 31):
    exp_id = f"sweep_v3_exp_{i:02d}"
    
    # 1. Get Config
    config_file = os.path.join(configs_dir, f"job_{exp_id}.json")
    params = {}
    try:
        with open(config_file, 'r') as f:
            job_def = json.load(f)
            # Extract SWEEP_CONFIG env var string
            env_vars = job_def['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']
            sweep_config_str = env_vars.get('SWEEP_CONFIG', '{}')
            params = json.loads(sweep_config_str)
    except Exception as e:
        print(f"Error reading config for {exp_id}: {e}")

    # 2. Get Results
    result_file = os.path.join(results_dir, exp_id, "result.json")
    stats = {"danger": -1, "safe": -1, "positive": -1}
    try:
        with open(result_file, 'r') as f:
            stats = json.load(f)
            stats.pop('details', None)
    except Exception as e:
        print(f"Error reading result for {exp_id}: {e}")

    # 3. Merge
    entry = {
        "Experiment": exp_id,
        "Danger (FP)": stats.get('danger', -1),
        "Positive (TP)": stats.get('positive', -1),
        "Safe": stats.get('safe', -1),
        "Dist Danger (m)": params.get('DIST_DANGER_M', -1),
        "Persistence (s)": params.get('DANGER_PERSISTENCE_SEC', -1),
        "EMA Alpha": params.get('EMA_ALPHA', -1),
        "Dist Warn (m)": params.get('DIST_WARN_M', -1)
    }
    data.append(entry)

df = pd.DataFrame(data)

# Sort by Danger (ascending) to highlight the winner
df_sorted = df.sort_values(by="Danger (FP)", ascending=True)

csv_output = df_sorted.to_csv(index=False)
markdown_output = df_sorted.to_markdown(index=False)

print("CSV GENERATED.")
with open("sweep_v3_full_report.csv", "w") as f:
    f.write(csv_output)
    
with open("sweep_v3_full_report.md", "w") as f:
    f.write(markdown_output)
