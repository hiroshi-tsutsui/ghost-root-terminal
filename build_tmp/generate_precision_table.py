import json
import os

def extract_threshold_metrics(path):
    if not os.path.exists(path): return None
    with open(path, 'r') as f:
        data = json.load(f)
    
    thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
    row = []
    
    # inward_day_detector -> minconf_0.5_pres_X.X -> default -> total_detected
    for t in thresholds:
        key = f"minconf_0.5_pres_{t:.1f}"
        val = data.get("inward_day_detector", {}).get(key, {}).get("default", {}).get("total_detected", "-")
        row.append(val)
    return row

def get_total_videos(path):
    if not os.path.exists(path): return 0
    with open(path, 'r') as f:
        data = json.load(f)
    return data.get("inward_day_detector", {}).get("minconf_0.5_pres_0.1", {}).get("default", {}).get("total_videos", 0)

print("| Model | Dataset | Total | 0.1s | 0.2s | 0.3s | 0.4s | 0.5s | 0.6s | 0.7s |")
print("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")

# 手動入力データ (James's history)
history = """| **v3_model_s** | phone | 52 | 20 | 12 | 10 | 6 | 3 | 3 | 1 |
| | **others** | 62 | 15 | 5 | 2 | **1** | **0** | **0** | **0** |
| | cigarette | 39 | 27 | 17 | 8 | 6 | 3 | 2 | 1 |
| **v2_model_s** | phone | 52 | 36 | 22 | 19 | 15 | **10** | 8 | 4 |
| | **others** | 62 | 31 | 12 | 7 | 4 | **3** | **0** | **0** |
| | cigarette | 39 | 28 | 22 | 11 | 9 | **7** | 3 | 1 |
| **v1_model_s** | phone | 52 | 45 | 27 | 21 | 17 | 10 | 10 | 8 |
| | **others** | 62 | 41 | 19 | 10 | 7 | 7 | 2 | 1 |
| | cigarette | 39 | 32 | 27 | 21 | 15 | 11 | 7 | 4 |
| **baseline** | phone | 52 | 50 | 36 | 28 | 22 | 20 | 15 | 11 |
| | **others** | 62 | 62 | 35 | 27 | 16 | 13 | 7 | 3 |
| | cigarette | 39 | 34 | 32 | 25 | 19 | 16 | 13 | 8 |
| **prod** | phone | 52 | 29 | 19 | 12 | 8 | 5 | 3 | 2 |
| | **others** | 62 | 10 | 5 | 3 | 2 | 2 | 1 | 0 |
| | cigarette | 39 | 23 | 16 | 4 | 4 | 4 | 3 | 3 |"""
print(history)

# V4 実データ
v4_p = extract_threshold_metrics("./build_tmp/precision_report/v4/phone/results.json")
v4_o = extract_threshold_metrics("./build_tmp/precision_report/v4/others/results.json")
v4_c = extract_threshold_metrics("./build_tmp/precision_report/v4/cigarette/results.json")

if v4_p:
    print(f"| **v4_model_s** | phone | 52 | {' | '.join(map(str, v4_p))} |")
    print(f"| | **others** | 62 | {' | '.join(map(str, v4_o))} |")
    print(f"| | cigarette | 39 | {' | '.join(map(str, v4_c))} |")

# V5 実データ
v5_p = extract_threshold_metrics("./build_tmp/precision_report/v5/phone/results.json")
v5_o = extract_threshold_metrics("./build_tmp/precision_report/v5/others/results.json")
v5_c = extract_threshold_metrics("./build_tmp/precision_report/v5/cigarette/results.json")

if v5_p:
    print(f"| **v5_model_s** | phone | 52 | {' | '.join(map(str, v5_p))} |")
    print(f"| | **others** | 62 | {' | '.join(map(str, v5_o))} |")
    print(f"| | cigarette | 39 | {' | '.join(map(str, v5_c))} |")
