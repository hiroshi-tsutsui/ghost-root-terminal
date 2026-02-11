import os
import json
import glob

def load_configs(job_files_pattern):
    configs = {}
    files = glob.glob(job_files_pattern)
    for f in files:
        # f is like job_sweep_v4_1_exp_01.json
        # remove prefix and suffix
        # "job_sweep_v4_1_exp_01.json" -> "exp_01"
        basename = os.path.basename(f)
        if "job_sweep_v4_1_" in basename:
            exp_id = basename.replace("job_sweep_v4_1_", "").replace(".json", "")
        else:
            continue

        try:
            with open(f, 'r') as jf:
                data = json.load(jf)
                try:
                    env_vars = data['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']
                    config_str = env_vars.get('SWEEP_CONFIG', '{}')
                    config = json.loads(config_str)
                    configs[exp_id] = config
                except (KeyError, IndexError, json.JSONDecodeError):
                    print(f"Warning: Could not parse config from {f}")
        except Exception as e:
            print(f"Error reading {f}: {e}")
    return configs

def load_results(base_dir, suffix=""):
    results = {}
    pattern = os.path.join(base_dir, f"sweep-v4-1{suffix}-exp-*")
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
    configs = load_configs("job_sweep_v4_1_exp_*.json")
    
    home = os.path.expanduser("~")
    fp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v4_1")
    tp_dir = os.path.join(home, "Downloads/yolo-gcp/eagle/infer/output/sweep_v4_1_tp")
    
    fp_results = load_results(fp_dir, suffix="")
    tp_results = load_results(tp_dir, suffix="-tp")
    
    # Header
    print("| Experiment | Danger (FP) | Positive (TP) | Safe | Dist Danger (m) | Persistence (s) | Warn (m) |")
    print("|:---|---:|---:|---:|---:|---:|---:|")
    
    # Sort keys
    all_keys = sorted(configs.keys())
    
    for k in all_keys:
        cfg = configs.get(k, {})
        fp = fp_results.get(k, {})
        tp = tp_results.get(k, {})
        
        fp_count = fp.get('danger', 0)
        tp_hits = tp.get('danger', 0)
        safe_count = fp.get('safe', 0)
        
        dist = cfg.get('DIST_DANGER_M', 0)
        persist = cfg.get('DANGER_PERSISTENCE_SEC', 0)
        warn = cfg.get('DIST_WARN_M', 0)
        
        # Only print if we have data or config
        print(f"| {k} | {fp_count} | {tp_hits} | {safe_count} | {dist} | {persist} | {warn} |")

if __name__ == "__main__":
    main()
