import os
import json
import glob

def load_configs(job_files_pattern):
    configs = {}
    files = glob.glob(job_files_pattern)
    for f in files:
        basename = os.path.basename(f)
        if "job_sweep_v4_1_" in basename:
            # handle both "job_sweep_v4_1_exp_01.json" and "job_sweep_v4_1_tp_exp_01.json"
            # Normalize to "exp_01"
            exp_id = basename.replace("job_sweep_v4_1_tp_", "").replace("job_sweep_v4_1_", "").replace(".json", "")
        else:
            continue

        try:
            with open(f, 'r') as jf:
                data = json.load(jf)
                try:
                    env_vars = data['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']
                    config_str = env_vars.get('SWEEP_CONFIG', '{}')
                    config = json.loads(config_str)
                    # Prefer TP config if we are parsing TP files, but they should be identical per experiment ID
                    if exp_id not in configs:
                        configs[exp_id] = config
                except (KeyError, IndexError, json.JSONDecodeError):
                    pass
        except Exception as e:
            pass
    return configs

def load_results(base_dir, prefix):
    results = {}
    # base_dir like ~/Downloads/.../sweep_v4_1
    # prefix like "sweep-v4-1-" or "sweep-v4-1-tp-"
    pattern = os.path.join(base_dir, f"{prefix}exp-*")
    dirs = glob.glob(pattern)
    
    for d in dirs:
        dirname = os.path.basename(d)
        parts = dirname.split('-')
        exp_num = parts[-1] # "01"
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
    # Load Configs (from both sets to ensure coverage)
    configs = load_configs("job_sweep_v4_1_exp_*.json")
    
    home = os.path.expanduser("~")
    fp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v4_1")
    tp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v4_1_tp")
    
    fp_results = load_results(fp_dir, prefix="sweep-v4-1-")
    tp_results = load_results(tp_dir, prefix="sweep-v4-1-tp-")
    
    print("| Experiment | Danger (FP) | Positive (TP) | Safe | Dist Danger (m) | Persistence (s) | Warn (m) |")
    print("|:---|---:|---:|---:|---:|---:|---:|")
    
    all_keys = sorted(configs.keys())
    
    # Sort by Danger (FP) ascending
    # We need to collect data first to sort
    rows = []
    
    for k in all_keys:
        cfg = configs.get(k, {})
        fp = fp_results.get(k, {})
        tp = tp_results.get(k, {})
        
        # Danger (FP) comes from the FP sweep (videos that should be safe but were flagged)
        fp_count = fp.get('danger', 0)
        safe_count = fp.get('safe', 0)
        
        # Positive (TP) comes from the TP sweep (videos that are danger and flagged as danger)
        # Note: In TP dataset, "Danger" count IS the True Positive count (Recall).
        tp_hits = tp.get('danger', 0)
        
        dist = cfg.get('DIST_DANGER_M', 0)
        persist = cfg.get('DANGER_PERSISTENCE_SEC', 0)
        warn = cfg.get('DIST_WARN_M', 0)
        
        if fp_count == 0 and safe_count == 0 and tp_hits == 0:
             continue # Skip empty/missing results

        rows.append({
            "k": k,
            "fp": fp_count,
            "tp": tp_hits,
            "safe": safe_count,
            "dist": dist,
            "persist": persist,
            "warn": warn
        })

    # Sort rows by FP (ascending), then TP (descending)
    rows.sort(key=lambda x: (x["fp"], -x["tp"]))
    
    for r in rows:
        print(f"| {r['k']} | {r['fp']} | {r['tp']} | {r['safe']} | {r['dist']} | {r['persist']} | {r['warn']} |")

if __name__ == "__main__":
    main()
