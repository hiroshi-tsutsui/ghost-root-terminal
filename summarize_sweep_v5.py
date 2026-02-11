import os
import json
import glob

def load_configs(job_files_pattern):
    configs = {}
    files = glob.glob(job_files_pattern)
    for f in files:
        basename = os.path.basename(f)
        if "job_sweep_v5_" in basename:
            exp_id = basename.replace("job_sweep_v5_tp_", "").replace("job_sweep_v5_", "").replace(".json", "")
        else:
            continue

        try:
            with open(f, 'r') as jf:
                data = json.load(jf)
                try:
                    env_vars = data['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']
                    config_str = env_vars.get('SWEEP_CONFIG', '{}')
                    config = json.loads(config_str)
                    if exp_id not in configs:
                        configs[exp_id] = config
                except (KeyError, IndexError, json.JSONDecodeError):
                    pass
        except Exception as e:
            pass
    return configs

def load_results(base_dir, prefix):
    results = {}
    pattern = os.path.join(base_dir, f"{prefix}exp-*")
    dirs = glob.glob(pattern)
    
    for d in dirs:
        dirname = os.path.basename(d)
        parts = dirname.split('-')
        exp_num = parts[-1] 
        exp_id = f"exp_{exp_num}"
        
        res_file = os.path.join(d, "result.json")
        if os.path.exists(res_file):
            try:
                with open(res_file, 'r') as f:
                    res = json.load(f)
                    results[exp_id] = res
            except Exception as e:
                pass
    return results

def main():
    # Load Configs
    configs = load_configs("job_sweep_v5_exp_*.json")
    
    home = os.path.expanduser("~")
    fp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v5")
    tp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v5_tp")
    
    fp_results = load_results(fp_dir, prefix="sweep-v5-")
    tp_results = load_results(tp_dir, prefix="sweep-v5-tp-")
    
    print("| Experiment | Danger (FP) | TP (Recall) | Dist (m) | Persist (s) | Warn (m) |")
    print("|:---|---:|---:|---:|---:|---:|")
    
    available_keys = [k for k in configs.keys() if k in fp_results] # Only list if FP is done
    
    rows = []
    
    for k in available_keys:
        cfg = configs.get(k, {})
        fp = fp_results.get(k, {})
        tp = tp_results.get(k, {})
        
        fp_count = fp.get('danger', 0)
        tp_count = tp.get('danger', 0) # In TP dataset, 'danger' detections ARE True Positives
        
        dist = cfg.get('DIST_DANGER_M', 0)
        persist = cfg.get('DANGER_PERSISTENCE_SEC', 0)
        warn = cfg.get('DIST_WARN_M', 0)
        
        rows.append({
            "k": k,
            "fp": fp_count,
            "tp": tp_count,
            "dist": dist,
            "persist": persist,
            "warn": warn
        })

    # Sort by FP (ascending)
    rows.sort(key=lambda x: x["fp"])
    
    for r in rows:
        # If TP is 0, it might mean the job hasn't finished/downloaded yet, or recall is 0. 
        # Check if TP dict is empty to distinguish? (Simplified here)
        print(f"| {r['k']} | {r['fp']} | {r['tp']} | {r['dist']} | {r['persist']} | {r['warn']} |")

if __name__ == "__main__":
    main()
