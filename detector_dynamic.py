import cv2
import numpy as np
import json
import time
from pathlib import Path
import argparse
import sys
import os

# --- PATH SETUP ---
current_dir = Path(__file__).parent
# Assuming the standard structure: services/following_distance_detection/detector.py
project_root = current_dir.parent.parent
yolo_path = project_root / "lane_cut_detection" / "lane_cut_predict" / "yolo11"
sys.path.append(str(yolo_path))

# Mock imports if running in isolation or missing deps
try:
    from services.lane_cut_detection.lane_cut_predict.yolo11.yolo11_run import YOLOv11VehicleDetector
except ImportError:
    print("Warning: Could not import YOLOv11VehicleDetector. Assuming mock or test environment.")
    # You might want a fallback here if this is critical

from utils.model_loader import download_model_if_needed

# Model Constant
CURRENT_YOLO_MODEL_PATH = "yolo_eagle_japan_v1_2025_06_20"

class FollowingDistanceDetector:
    def __init__(self, model_name=None):
        default_classes = ['car', 'truck', 'bus', 'motorcycle']
        
        # 1. Load Model
        if model_name is None:
            print(f"Downloading YOLO model: {CURRENT_YOLO_MODEL_PATH}")
            try:
                model_path = download_model_if_needed(CURRENT_YOLO_MODEL_PATH)
                print(f"Model downloaded to: {model_path}")
                model_name = model_path
                target_classes_names = ['car']
            except Exception as e:
                print(f"Failed to download model: {e}")
                # Fallback for local testing or pre-downloaded
                model_name = "yolo11x.pt" 
                target_classes_names = default_classes
        else:
            target_classes_names = default_classes
            
        self.vehicle_detector = YOLOv11VehicleDetector(
            model_name=model_name, 
            target_classes_names=target_classes_names
        )
        
        # 2. Default Parameters
        self.params = {
            "W_REAL": 1.8, "H_CAM": 2.8, "H_TARGET_REF": 0.6, "HFOV_DEG": 85,
            "EMA_ALPHA": 0.3, "EMA_ALPHA_V": 0.1,
            "DIST_WARN_M": 25.0,
            "DIST_DANGER_M": 15.0,
            "DANGER_PERSISTENCE_SEC": 0.6,
            "RECOVERY_THRESHOLD_M": 5.0,
            "USE_STATUS_DISPLAY": True,
            "LANE_BOTTOM_W": 0.4, "LANE_TOP_W": 0.1, "LANE_START_Y": 0.55,
            "LANE_OFFSET_X": 0.02,
            "WIDTH_CONTAINMENT_RATIO": 0.9,
            "FRAME_SKIP": 2
        }

        # 3. OVERRIDE FROM ENV VAR (For Hyperparameter Tuning)
        config_json = os.environ.get("FOLLOWING_DISTANCE_CONFIG_JSON")
        if config_json:
            print(f"Applying config override from env: {config_json}")
            try:
                overrides = json.loads(config_json)
                self.params.update(overrides)
            except json.JSONDecodeError as e:
                print(f"Error parsing config env var: {e}")

    def estimate_distance_engine(self, w_px_obj, W_px_total, last_d, last_v, dt):
        """Geometry + EMA"""
        hfov_rad = np.radians(self.params["HFOV_DEG"])
        h_rel = self.params["H_CAM"] - self.params["H_TARGET_REF"]
        
        denominator = 2 * w_px_obj * np.tan(hfov_rad / 2)
        if denominator == 0: return 0, 0
        L = (self.params["W_REAL"] * W_px_total) / denominator
        D_raw = np.sqrt(L**2 - h_rel**2) if L > h_rel else L
        
        # Distance EMA
        alpha_d = self.params["EMA_ALPHA"]
        D_final = (last_d * (1 - alpha_d)) + (D_raw * alpha_d) if last_d is not None else D_raw
        
        # Speed EMA (simple)
        rel_speed_filtered = 0
        if last_d is not None and dt > 0:
            raw_v = (last_d - D_final) / dt
            alpha_v = self.params["EMA_ALPHA_V"]
            rel_speed_filtered = (last_v * (1 - alpha_v)) + (raw_v * alpha_v)
                
        return D_final, rel_speed_filtered

    def is_in_lane_flexible(self, x_center, y_bottom, bbox_w, frame_width, frame_height):
        """Lane Containment Check"""
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

    def analyze_video(self, video_path, output_path=None, annotate=False):
        """
        Analyze a single video.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            print(f"Error opening video: {video_path}")
            return {"status": "error", "logs": []}

        width, height = int(cap.get(3)), int(cap.get(4))
        fps = cap.get(cv2.CAP_PROP_FPS) or 10.0

        # Adjust HFOV based on Aspect Ratio
        aspect_ratio = width / height
        self.params["HFOV_DEG"] = 100 if aspect_ratio > 1.5 else 85
        
        track_data = {}
        danger_confirmed = False
        positive_confirmed = False
        danger_limit_count = self.params["DANGER_PERSISTENCE_SEC"] / (self.params["FRAME_SKIP"] / fps)

        following_distance_logs = []

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            
            # Skip frames
            if frame_count % self.params["FRAME_SKIP"] != 0:
                continue
                
            current_t = frame_count / fps
            dt = self.params["FRAME_SKIP"] / fps
            
            # YOLO Tracking
            results = self.vehicle_detector.model.track(frame, persist=True, conf=0.5, iou=0.3, verbose=False, imgsz=640)
            
            if results[0].boxes.id is not None:
                boxes = results[0].boxes.xywh.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().tolist()
                
                for box, tid in zip(boxes, track_ids):
                    xc, yc, w, h = box
                    if self.is_in_lane_flexible(xc, yc + h/2, w, width, height):
                        if tid not in track_data:
                            track_data[tid] = {"last_d": None, "last_v": 0, "min_d": 999.0, "danger_count": 0, "entered_warn": False}
                        
                        data = track_data[tid]
                        dist, rel_v = self.estimate_distance_engine(w, width, data["last_d"], data["last_v"], dt)
                        data["last_d"], data["last_v"] = dist, rel_v
                        
                        # Danger Logic
                        if dist < self.params["DIST_DANGER_M"]:
                            data["danger_count"] += 1
                            if data["danger_count"] >= danger_limit_count:
                                danger_confirmed = True
                            
                            current_second = int(current_t)
                            while len(following_distance_logs) <= current_second:
                                following_distance_logs.append({"isDetected": False})
                            following_distance_logs[current_second] = {"isDetected": True}
                        else:
                            data["danger_count"] = 0
                        
                        # Warning Logic
                        if dist < self.params["DIST_WARN_M"]:
                            data["entered_warn"] = True
                            data["min_d"] = min(data["min_d"], dist)
                        
                        if data["entered_warn"]:
                             if (dist - data["min_d"]) >= self.params["RECOVERY_THRESHOLD_M"]:
                                positive_confirmed = True

            else:
                # Cleanup stale tracks
                for tid in list(track_data.keys()):
                    track_data[tid]["stale_frames"] = track_data[tid].get("stale_frames", 0) + 1
                    if track_data[tid]["stale_frames"] > 5:
                        del track_data[tid]

        cap.release()
        
        final_status = "danger" if danger_confirmed else ("positive" if positive_confirmed else "safe")
        return {
            "status": final_status,
            "fps": fps,
            "logs": {
                "followingDistance": following_distance_logs
            },
            "video_duration_seconds": len(following_distance_logs)
        }

# ... (Main block remains similar, but execute logic assumes usage via test_following_distance.py usually)
