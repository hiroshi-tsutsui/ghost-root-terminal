import json
import os

def extract_metrics(path):
    if not os.path.exists(path): return {"total_detected": "N/A", "phone": "-", "cigarette": "-"}
    try:
        with open(path, 'r') as f:
            data = json.load(f)
        key = "minconf_0.5_pres_0.5"
        res = data.get("inward_day_detector", {}).get(key, {}).get("default", {})
        return res
    except:
        return {"total_detected": "Err", "phone": "-", "cigarette": "-"}

# 各バージョンの結果を集約
# V1, V2 は過去のログから数値を固定（GCSパスが見当たらないため、ベースライン比較用）
# V3 は直近の推論結果から取得

versions = {
    "Baseline (v1)": {"phone": 12, "cigarette": 5, "others_fp": 8},
    "Production (v2)": {"phone": 10, "cigarette": 4, "others_fp": 3},
    "Sweep V3": {"phone": 8, "cigarette": 3, "others_fp": 2},
}

# V3, V4, V5 の実データをロード
v3_p = extract_metrics("./build_tmp/historical_results/v3/phone.json")
v3_c = extract_metrics("./build_tmp/historical_results/v3/cigarette.json")
v3_o = extract_metrics("./build_tmp/historical_results/v3/others.json")

v4_p = extract_metrics("./build_tmp/precision_report/v4/phone/results.json")
v4_c = extract_metrics("./build_tmp/precision_report/v4/cigarette/results.json")
v4_o = extract_metrics("./build_tmp/precision_report/v4/others/results.json")

v5_p = extract_metrics("./build_tmp/precision_report/v5/phone/results.json")
v5_c = extract_metrics("./build_tmp/precision_report/v5/cigarette/results.json")
v5_o = extract_metrics("./build_tmp/precision_report/v5/others/results.json")

print("| Experiment (Model) | Danger (FP) | Positive (TP) | Safe | Dist Danger (m) | Persistence (s) | Warn (m) |")
print("| :--- | ---: | ---: | ---: | ---: | ---: | ---: |")

# V3
v3_tp = v3_p.get("phone", 0) + v3_c.get("cigarette", 0)
v3_fp = v3_o.get("total_detected", 0)
print(f"| falcon-cls-v3-s | {v3_fp} | {v3_tp} | {62-v3_fp} | - | - | - |")

# V4
v4_tp = v4_p.get("phone", 0) + v4_c.get("cigarette", 0)
v4_fp = v4_o.get("total_detected", 0)
print(f"| falcon-cls-v4-s | {v4_fp} | {v4_tp} | {62-v4_fp} | - | - | - |")

# V5 (Winner)
v5_tp = v5_p.get("phone", 0) + v5_c.get("cigarette", 0)
v5_fp = v5_o.get("total_detected", 0)
print(f"| **falcon-cls-v5-s (Winner)** | **{v5_fp}** | **{v5_tp}** | **{62-v5_fp}** | - | - | - |")

print("\n--- Summary ---")
print(f"V3: Phone {v3_p.get('phone')}, Cig {v3_c.get('cigarette')}, FP {v3_fp}")
print(f"V4: Phone {v4_p.get('phone')}, Cig {v4_c.get('cigarette')}, FP {v4_fp}")
print(f"V5: Phone {v5_p.get('phone')}, Cig {v5_c.get('cigarette')}, FP {v5_fp}")
