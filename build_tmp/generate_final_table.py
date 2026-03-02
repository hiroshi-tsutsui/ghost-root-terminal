import json
import os

def extract(path):
    if not os.path.exists(path): return {}
    with open(path, 'r') as f:
        data = json.load(f)
    # 実運用に近い閾値 (Conf 0.5, Presence 0.5) を抽出
    return data.get("inward_day_detector", {}).get("minconf_0.5_pres_0.5", {}).get("default", {})

results = []
for v in ["v4", "v5"]:
    for c in ["phone", "cigarette", "others"]:
        res = extract(f"./build_tmp/precision_report/{v}/{c}/results.json")
        results.append({
            "Version": v.upper(),
            "Target": c.capitalize(),
            "Total": res.get("total_videos", 0),
            "Detected": res.get("total_detected", 0),
            "Phone": res.get("phone", 0),
            "Cigarette": res.get("cigarette", 0)
        })

print("| Version | Dataset | Total | TP/FP (Total) | as Phone | as Cigarette | Result |")
print("| :--- | :--- | ---: | ---: | ---: | ---: | :--- |")
for r in results:
    status = "OK"
    if r["Target"] == "Others":
        status = "✅ CLEAN" if r["Detected"] == 0 else "❌ FP ALERT"
    else:
        status = "🎯 HIT" if r["Detected"] > 0 else "💨 MISS"
        
    print(f"| {r['Version']} | {r['Target']} | {r['Total']} | {r['Detected']} | {r['Phone']} | {r['Cigarette']} | {status} |")
