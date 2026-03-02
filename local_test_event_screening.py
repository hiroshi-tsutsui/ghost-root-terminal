import argparse
import os
import json

import matplotlib.pyplot as plt

from services.detectors.inward.falcon.inward_day_detector_v4 import InwardDayDetector as InwardDayDetectorV4

def main(args):
    # overall_results structure:
    # {
    #   "<ENGINE_NAME>": {
    #       "minconf_<min_conf>_purity_<purity>": {
    #           "<label>": {
    #               "total_videos": <int>,
    #               "holdingSomething": <int>
    #           },
    #           ...
    #       },
    #       ...
    #   }
    # }
    ENGINE_NAME = "inward_day_detector"
    overall_results = {ENGINE_NAME: {}}

    os.makedirs(args.output_dir, exist_ok=True)

    for min_conf in args.min_confidences:
        print(f"\n=== Running with MIN_CONFIDENCE={min_conf} ===")
        controller = InwardDayDetectorV4(base_conf=min_conf, model_path=args.model_path)

        # ① Get Video Files
        video_files = []
        for root, dirs, files in os.walk(args.input_dir):
            for file in files:
                if file.lower().endswith((".mp4", ".mov", ".avi", ".mkv")):
                    relative_path = os.path.relpath(root, args.input_dir)
                    video_files.append((relative_path, file))

        full_list = []
        for rel_path, filename in video_files:
            if rel_path == ".":
                vp = os.path.join(args.input_dir, filename)
                label = "default"
            else:
                vp = os.path.join(args.input_dir, rel_path, filename)
                label = os.path.normpath(rel_path).split(os.sep)[0]
            full_list.append({"path": vp, "label": label})
        print(f"Total videos found: {len(full_list)}")

        # ② Run Inference
        per_video_stats = []
        for idx, info in enumerate(full_list, start=1):
            video_path = info["path"]
            label     = info["label"]
            print(f"Processing video {idx}/{len(full_list)}: {video_path}")
            
            response = controller._process_video(video_path)
            logs = response["logs"]
            frame_count = len(logs["phone"])
            
            # Count Detections
            confirmed_phone_frames = sum(1 for frame in logs["phone"] if frame["isDetected"])
            confirmed_cigarette_frames = sum(1 for frame in logs["cigarette"] if frame["isDetected"])
            
            # v4 Logic: Get YOLO Raw Detections (New Feature)
            yolo_phone_frames = sum(1 for frame in logs.get("yolo_phone", []) if frame["isDetected"])
            yolo_cigarette_frames = sum(1 for frame in logs.get("yolo_cigarette", []) if frame["isDetected"])
            
            per_video_stats.append({
                "path": video_path,
                "label": label,
                "frame_count": frame_count,
                "phone_frames": confirmed_phone_frames,      
                "cigarette_frames": confirmed_cigarette_frames, 
                "yolo_phone_frames": yolo_phone_frames, 
                "yolo_cigarette_frames": yolo_cigarette_frames
            })

        # Save Raw JSON
        raw_json_path = os.path.join(args.output_dir, f"raw_results_minconf_{min_conf}.json")
        with open(raw_json_path, "w") as rf:
            json.dump(per_video_stats, rf, indent=2)
        print(f"  → Saved raw results to {raw_json_path}")

        # ③ Sweep Purity Thresholds
        # args.holding_thresholds is reused as purity_thresholds
        for purity in args.holding_thresholds:
            key = f"minconf_{min_conf}_pres_{purity}" # keep key name 'pres' for compatibility with existing parser if needed, or change to 'purity'
            # Let's keep 'pres' format for graph script compatibility? 
            # Or clarify it's purity. Let's use 'pres' but know it means purity in this context.
            
            overall_results[ENGINE_NAME][key] = {}
            labels = sorted({v["label"] for v in per_video_stats})
            
            for lbl in labels:
                vids = [v for v in per_video_stats if v["label"] == lbl]
                total_videos = len(vids)
                phone_count = 0
                cigarette_count = 0
                total_detected_count = 0
                
                for v in vids:
                    # Purity Calculation
                    # Phone
                    yolo_p = v["yolo_phone_frames"]
                    conf_p = v["phone_frames"]
                    purity_p = (conf_p / yolo_p) if yolo_p > 0 else 0
                    is_phone = (purity_p >= purity) and (yolo_p > 0) # Must have at least one detection
                    
                    # Cigarette
                    yolo_c = v["yolo_cigarette_frames"]
                    conf_c = v["cigarette_frames"]
                    purity_c = (conf_c / yolo_c) if yolo_c > 0 else 0
                    is_cigarette = (purity_c >= purity) and (yolo_c > 0)
                    
                    if is_phone: phone_count += 1
                    if is_cigarette: cigarette_count += 1
                    if is_phone or is_cigarette: total_detected_count += 1

                overall_results[ENGINE_NAME][key][lbl] = {
                    "total_videos": total_videos,
                    "total_detected": total_detected_count,
                    "phone": phone_count,
                    "cigarette": cigarette_count
                }
            print(f"  → {key} (Purity={purity}): computed for labels {labels}")

    # ⑤ Save Final JSON
    final_json_path = os.path.join(args.output_dir, "results_all.json")
    with open(final_json_path, "w") as jf:
        json.dump(overall_results, jf, indent=2)
    print(f"\n=== Saved final JSON to {final_json_path} ===")

    # ⑥ Graph Generation (Purity Axis)
    with open(final_json_path, "r") as f:
        results = json.load(f)

    grouped = {} 
    for combo_key, labels_data in results[ENGINE_NAME].items():
        parts = combo_key.split("_")
        minconf_val = parts[1]
        pres_val = float(parts[3]) # This is Purity
        if minconf_val not in grouped:
            grouped[minconf_val] = {}
        grouped[minconf_val][pres_val] = labels_data

    graph_dir = os.path.join(args.output_dir, "graphs")
    os.makedirs(graph_dir, exist_ok=True)

    for minconf_val, pres_dict in grouped.items():
        plt.figure(figsize=(8, 5))
        all_labels = sorted({lbl for pres_val in pres_dict for lbl in pres_dict[pres_val].keys()})
        for lbl in all_labels:
            x_vals = []
            y_vals_phone = []
            y_vals_cigarette = []
            for pres_val in sorted(pres_dict.keys()):
                counts = pres_dict[pres_val].get(lbl, {"total_videos": 0, "phone": 0, "cigarette": 0})
                total = counts["total_videos"]
                phone = counts["phone"]
                cigarette = counts["cigarette"]
                phone_ratio = (phone / total) if total > 0 else 0
                cigarette_ratio = (cigarette / total) if total > 0 else 0
                x_vals.append(pres_val)
                y_vals_phone.append(phone_ratio)
                y_vals_cigarette.append(cigarette_ratio)
            
            plt.plot(x_vals, y_vals_phone, marker='o', label=f"{lbl} (Phone)")
            plt.plot(x_vals, y_vals_cigarette, marker='x', linestyle='--', label=f"{lbl} (Cigarette)")
        plt.title(f'Purity Threshold Sweep (min_conf={minconf_val})') # Updated Title
        plt.xlabel("PURITY_THRESHOLD (Confirmed/YOLO)") # Updated Label
        plt.ylabel("Detection Ratio (Videos Detected / Total Videos)")
        plt.ylim(0, 1.0)
        plt.legend()
        plt.grid(True)
        graph_path = os.path.join(graph_dir, f"graph_minconf_{minconf_val}.png")
        plt.savefig(graph_path)
        plt.close()
        print(f"Saved graph for min_conf={minconf_val} to {graph_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="YOLO 推論 + Purity Threshold Sweep"
    )
    parser.add_argument("--input_dir", type=str, required=True, help="Input directory")
    parser.add_argument("--output_dir", type=str, required=True, help="Output directory")
    parser.add_argument("--min_confidences", type=float, nargs="+", default=[0.4], help="YOLO conf thresholds")
    parser.add_argument("--holding_thresholds", type=float, nargs="+", default=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], help="Purity Thresholds to sweep")
    parser.add_argument("--model_path", type=str, default=None, help="Model path")
    parser.add_argument("--annotate", action="store_true", help="Save annotated videos")
    args = parser.parse_args()
    main(args)
