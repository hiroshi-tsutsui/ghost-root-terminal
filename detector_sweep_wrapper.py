import subprocess
import sys
import os
import json

# ==================================================================================
# PATCH: Do NOT use pip install. Use built-in libraries only.
# Cloud Batch (Default Pool) has NO INTERNET ACCESS.
# ==================================================================================

# Try to import libraries. If they fail, we must fail gracefully or skip tracking.
try:
    import ultralytics
except ImportError:
    # If ultralytics is missing, we can try to install it locally if a wheel is provided
    # or just exit. Since we don't have internet, pip install will fail.
    # Check if we can find it in a different path?
    sys.path.append("/usr/local/lib/python3.11/site-packages") # Common path
    try:
        import ultralytics
    except ImportError:
        print("CRITICAL ERROR: 'ultralytics' not found in environment.")
        sys.exit(1)

try:
    import torch
except ImportError:
    print("CRITICAL ERROR: 'torch' not found in environment.")
    sys.exit(1)

import cv2
import numpy as np
from ultralytics import YOLO

class FollowingDistanceDetector:
    def __init__(self, model_path, config):
        self.model = YOLO(model_path)
        self.params = {
            "W_REAL": 1.8, "H_CAM": 2.8, "H_TARGET_REF": 0.6, "HFOV_DEG": 85,
            "EMA_ALPHA": 0.3, "EMA_ALPHA_V": 0.1,
            "DIST_WARN_M": 30.0,
            "DIST_DANGER_M": 12.0,
            "DANGER_PERSISTENCE_SEC": 0.8,
            "RECOVERY_THRESHOLD_M": 5.0,
            "LANE_BOTTOM_W": 0.4, "LANE_TOP_W": 0.1, "LANE_START_Y": 0.55,
            "LANE_OFFSET_X": 0.02,
            "WIDTH_CONTAINMENT_RATIO": 0.9,
            "FRAME_SKIP": 2
        }
        # Override with sweep config
        if config:
            print(f"Overriding params with: {config}")
            self.params.update(config)

    def estimate_distance_engine(self, w_px_obj, W_px_total, last_d, last_v, dt):
        hfov_rad = np.radians(self.params["HFOV_DEG"])
        h_rel = self.params["H_CAM"] - self.params["H_TARGET_REF"]
        denominator = 2 * w_px_obj * np.tan(hfov_rad / 2)
        if denominator == 0: return 0, 0
        L = (self.params["W_REAL"] * W_px_total) / denominator
        D_raw = np.sqrt(L**2 - h_rel**2) if L > h_rel else L
        alpha_d = self.params["EMA_ALPHA"]
        D_final = (last_d * (1 - alpha_d)) + (D_raw * alpha_d) if last_d is not None else D_raw
        rel_speed_filtered = 0 # Simplified for sweep
        return D_final, rel_speed_filtered

    def is_in_lane_flexible(self, x_center, y_bottom, bbox_w, frame_width, frame_height):
        p = self.params
        top_w = frame_width * p["LANE_TOP_W"]
        bottom_w = frame_width * p["LANE_BOTTOM_W"]
        start_y = frame_height * p["LANE_START_Y"]
        offset_x = frame_width * p["LANE_OFFSET_X"]
        if y_bottom < start_y: return False
        rel_y = (y_bottom - start_y) / (frame_height - start_y)
        current_lane_w = top_w + (bottom_w - top_w) * rel_y
        center_x = (frame_width / 2) + offset_x
        lane_x1, lane_x2 = center_x - (current_lane_w/2), center_x + (current_lane_w/2)
        veh_x1, veh_x2 = x_center - (bbox_w / 2), x_center + (bbox_w / 2)
        overlap_w = max(0, min(veh_x2, lane_x2) - max(veh_x1, lane_x1))
        return (overlap_w / bbox_w) >= p["WIDTH_CONTAINMENT_RATIO"]

    def analyze_video(self, video_path):
        cap = cv2.VideoCapture(str(video_path))
        width, height = int(cap.get(3)), int(cap.get(4))
        fps = cap.get(cv2.CAP_PROP_FPS) or 10.0
        aspect_ratio = width / height
        self.params["HFOV_DEG"] = 100 if aspect_ratio > 1.5 else 85
        
        track_data = {}
        danger_confirmed = False
        positive_confirmed = False
        danger_limit_count = self.params["DANGER_PERSISTENCE_SEC"] / (self.params["FRAME_SKIP"] / fps)
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            if frame_count % self.params["FRAME_SKIP"] != 0: continue
            
            dt = self.params["FRAME_SKIP"] / fps
            results = self.model.track(frame, persist=True, conf=0.5, iou=0.3, verbose=False, imgsz=640)
            
            if results[0].boxes.id is not None:
                boxes = results[0].boxes.xywh.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().tolist()
                for box, tid in zip(boxes, track_ids):
                    xc, yc, w, h = box
                    if self.is_in_lane_flexible(xc, yc + h/2, w, width, height):
                        if tid not in track_data:
                            track_data[tid] = {"last_d": None, "last_v": 0, "min_d": 999.0, "danger_count": 0, "entered_warn": False}
                        data = track_data[tid]
                        dist, _ = self.estimate_distance_engine(w, width, data["last_d"], data["last_v"], dt)
                        data["last_d"] = dist
                        
                        if dist < self.params["DIST_DANGER_M"]:
                            data["danger_count"] += 1
                            if data["danger_count"] >= danger_limit_count:
                                danger_confirmed = True
                        else:
                            data["danger_count"] = 0
                        
                        if dist < self.params["DIST_WARN_M"]:
                            data["entered_warn"] = True
                            data["min_d"] = min(data["min_d"], dist)
                        
                        if data["entered_warn"]:
                            if (dist - data["min_d"]) >= self.params["RECOVERY_THRESHOLD_M"]:
                                positive_confirmed = True

        cap.release()
        return "danger" if danger_confirmed else ("positive" if positive_confirmed else "safe")

def main():
    input_dir = "/mnt/disks/input"
    output_file = "/mnt/disks/output/result.json"
    model_path = "/mnt/disks/model/eagle_best_v1.pt"
    if not os.path.exists(model_path):
        # Try best.pt as fallback for V3
        fallback = "/mnt/disks/model/best.pt"
        if os.path.exists(fallback):
             print(f"Using fallback model: {fallback}")
             model_path = fallback
        else:
             print(f"Warning: Model not found at {model_path}, trying default yolo11x.pt")
             model_path = "yolo11x.pt"

    config_str = os.environ.get("SWEEP_CONFIG", "{}")
    config = json.loads(config_str)
    
    detector = FollowingDistanceDetector(model_path, config)
    
    results = {"danger": 0, "safe": 0, "positive": 0, "details": {}}
    
    import glob
    videos = glob.glob(os.path.join(input_dir, "*"))
    print(f"Processing {len(videos)} videos...")
    
    for v in videos:
        try:
            status = detector.analyze_video(v)
            results[status] = results.get(status, 0) + 1
            results["details"][os.path.basename(v)] = status
        except Exception as e:
            print(f"Error {v}: {e}")
            
    with open(output_file, "w") as f:
        json.dump(results, f)

if __name__ == "__main__":
    main()
