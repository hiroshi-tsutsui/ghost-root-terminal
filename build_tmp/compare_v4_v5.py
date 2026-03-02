import json
import os

def load_results(path):
    with open(path, 'r') as f:
        data = json.load(f)
    # 0.5 の結果を抽出 (通常これが最終的な判定に使われるため)
    return data.get("0.5", {})

v4_phone = load_results('./build_tmp/v4_results/phone.json')
v4_cigarette = load_results('./build_tmp/v4_results/cigarette.json')
v4_others = load_results('./build_tmp/v4_results/others.json')

v5_phone = load_results('./build_tmp/v5_results/phone.json')
v5_cigarette = load_results('./build_tmp/v5_results/cigarette.json')
v5_others = load_results('./build_tmp/v5_results/others.json')

def print_summary(version, phone, cigarette, others):
    print(f"--- {version} Summary (Conf 0.5) ---")
    # TP
    print(f"Phone TP: {phone.get('total_events', 0)}")
    print(f"Cigarette TP: {cigarette.get('total_events', 0)}")
    # FP (others クラスにおいて phone または cigarette と誤判定された数)
    # others.json の中身がどうなっているか確認が必要だが、通常 total_events が検出数
    print(f"Others (FP) Events: {others.get('total_events', 0)}")
    
print_summary("V4", v4_phone, v4_cigarette, v4_others)
print_summary("V5", v5_phone, v5_cigarette, v5_others)
