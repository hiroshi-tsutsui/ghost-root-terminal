import json
import os

def extract_metrics(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # 代表的な閾値 minconf=0.5, presence=0.5 を抽出
    key = "minconf_0.5_pres_0.5"
    metrics = data.get("inward_day_detector", {}).get(key, {}).get("default", {})
    return metrics

def compare():
    models = ["v4", "v5"]
    classes = ["phone", "cigarette", "others"]
    
    results = {}
    for m in models:
        results[m] = {}
        for c in classes:
            path = f"./build_tmp/{m}_results/{c}.json"
            results[m][c] = extract_metrics(path)

    print("| Model | Class | Total Videos | Detected (TP/FP) | Phone | Cigarette |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- |")
    
    for m in models:
        for c in classes:
            res = results[m][c]
            print(f"| {m.upper()} | {c.capitalize()} | {res.get('total_videos', 0)} | {res.get('total_detected', 0)} | {res.get('phone', 0)} | {res.get('cigarette', 0)} |")

if __name__ == "__main__":
    compare()
