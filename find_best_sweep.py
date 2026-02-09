import json
import os
import glob

base_dir = os.path.expanduser("~/Downloads/yolo-gcp/eagle/infer/output/sweep_v3/")
files = glob.glob(os.path.join(base_dir, "*/result.json"))

best_exp = None
min_danger = float('inf')

for f in files:
    try:
        with open(f, 'r') as json_file:
            data = json.load(json_file)
            danger = data.get('danger', 0)
            positive = data.get('positive', 0)
            
            # Filter out invalid runs
            if positive == 0:
                continue
                
            if danger < min_danger:
                min_danger = danger
                best_exp = {
                    "file": f,
                    "stats": data
                }
    except Exception as e:
        print(f"Error reading {f}: {e}")

if best_exp:
    print(f"WINNER: {best_exp['file']}")
    print(f"STATS: {json.dumps(best_exp['stats'], indent=2)}")
else:
    print("No valid experiments found.")
