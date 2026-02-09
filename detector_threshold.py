import cv2
import numpy as np
import json
import time
from pathlib import Path
import argparse
from datetime import datetime
import sys
import os
import shutil
import tempfile

# パス設定
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent  
yolo_path = project_root / "lane_cut_detection" / "lane_cut_predict" / "yolo11"
sys.path.append(str(yolo_path))

try:
    from services.lane_cut_detection.lane_cut_predict.yolo11.yolo11_run import YOLOv11VehicleDetector
except ImportError:
    print("Please ensure yolo11_run.py file exists in the lane_cut_detection/lane_cut_predict/yolo11 directory")
    sys.exit(1)

from utils.model_loader import download_model_if_needed

# モデルパス定数
CURRENT_YOLO_MODEL_PATH = "yolo_eagle_japan_v1_2025_06_20"

class FollowingDistanceDetector:
    """
    Advanced Following Distance Detection System - Production Version (v12.1 Logic)
    """
    
    def __init__(self, model_name=None):
        default_classes = ['car', 'truck', 'bus', 'motorcycle']
        # 1. モデルのロード
        if model_name is None:
            print(f"Downloading YOLO model from GCS: {CURRENT_YOLO_MODEL_PATH}")
            model_path = download_model_if_needed(CURRENT_YOLO_MODEL_PATH)
            print(f"YOLO model downloaded to: {model_path}")
            # Use the absolute path directly so the wrapper can load it without relying on a specific directory
            model_name = model_path
            target_classes_names = ['car']
        else:
            target_classes_names = default_classes
        
        self.vehicle_detector = YOLOv11VehicleDetector(
            model_name=model_name, 
            target_classes_names=target_classes_names
        )
        
        # 2. v12.1 最終パラメータ設定 (MODIFIED FOR THRESHOLD EXPERIMENT)
        self.params = {
            "W_REAL": 1.8, "H_CAM": 2.8, "H_TARGET_REF": 0.6, "HFOV_DEG": 85,
            "EMA_ALPHA": 0.3, "EMA_ALPHA_V": 0.1,
            "DIST_WARN_M": 30.0,  # Modified from 25.0 to be more sensitive for warning
            "DIST_DANGER_M": 12.0, # Modified from 15.0 to be LESS sensitive for Danger (reduce False Positives)
            "DANGER_PERSISTENCE_SEC": 0.8, # Modified from 0.6 to require longer persistence (reduce ghosts)
            "RECOVERY_THRESHOLD_M": 5.0,
            "GOOD_REACTION_SPEED": -0.5, 
            "USE_STATUS_DISPLAY": True,
            "LANE_BOTTOM_W": 0.4, "LANE_TOP_W": 0.1, "LANE_START_Y": 0.55,
            "LANE_OFFSET_X": 0.02,
            "WIDTH_CONTAINMENT_RATIO": 0.9,
            "FRAME_SKIP": 2
        }

    def estimate_distance_engine(self, w_px_obj, W_px_total, last_d, last_v, dt):
        """幾何計算 + EMAフィルタリング"""
        hfov_rad = np.radians(self.params["HFOV_DEG"])
        h_rel = self.params["H_CAM"] - self.params["H_TARGET_REF"]
        
        denominator = 2 * w_px_obj * np.tan(hfov_rad / 2)
        if denominator == 0: return 0, 0
        L = (self.params["W_REAL"] * W_px_total) / denominator
        D_raw = np.sqrt(L**2 - h_rel**2) if L > h_rel else L
        
        # 距離EMA
        alpha_d = self.params["EMA_ALPHA"]
        D_final = (last_d * (1 - alpha_d)) + (D_raw * alpha_d) if last_d is not None else D_raw
        
        # 速度EMA
        rel_speed_filtered = 0
        if last_d is not None and dt > 0:
            raw_v = (last_d - D_final) / dt
            alpha_v = self.params["EMA_ALPHA_V"]
            rel_speed_filtered = (last_v * (1 - alpha_v)) + (raw_v * alpha_v)
                
        return D_final, rel_speed_filtered

    def is_in_lane_flexible(self, x_center, y_bottom, bbox_w, frame_width, frame_height):
        """90%幅収容ルールに基づく自車線判定"""
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
        Core analysis method: Detects Danger, Positive, or Safe status.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError(f"Unable to open video: {video_path}")

        width, height = int(cap.get(3)), int(cap.get(4))
        fps = cap.get(cv2.CAP_PROP_FPS) or 10.0

        # Adjust HFOV_DEG based on video aspect ratio
        aspect_ratio = width / height
        # Use 100 for 16:9 videos (aspect ratio > 1.5), 85 for 4:3 videos
        self.params["HFOV_DEG"] = 100 if aspect_ratio > 1.5 else 85
        
        out = None
        if annotate and output_path:
            out = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
            
        track_data = {}
        danger_confirmed = False
        positive_confirmed = False
        danger_limit_count = self.params["DANGER_PERSISTENCE_SEC"] / (self.params["FRAME_SKIP"] / fps)

        # Initialize logs array dynamically as we process frames
        # Each entry is an object for downstream consistency
        following_distance_logs = []

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frame_count += 1
            
            # フレームスキップ (v12.1: 2)
            if frame_count % self.params["FRAME_SKIP"] != 0:
                if out: out.write(frame)
                continue
                
            current_t = frame_count / fps
            dt = self.params["FRAME_SKIP"] / fps
            
            # トラッキング実行 (高速化設定: half=True)
            results = self.vehicle_detector.model.track(frame, persist=True, conf=0.5, iou=0.3, verbose=False, imgsz=640)
            
            if results[0].boxes.id is not None:
                boxes = results[0].boxes.xywh.cpu().numpy()
                track_ids = results[0].boxes.id.int().cpu().tolist()
                
                for box, tid in zip(boxes, track_ids):
                    xc, yc, w, h = box
                    if self.is_in_lane_flexible(xc, yc + h/2, w, width, height):
                        if tid not in track_data:
                            track_data[tid] = {"last_d": None, "last_v": 0, "min_d": 999.0, "danger_count": 0, "entered_warn": False, "pos_done": False}
                        
                        data = track_data[tid]
                        dist, rel_v = self.estimate_distance_engine(w, width, data["last_d"], data["last_v"], dt)
                        data["last_d"], data["last_v"] = dist, rel_v
                        
                        # Danger判定 (0.6s 継続)
                        if dist < self.params["DIST_DANGER_M"]:
                            data["danger_count"] += 1
                            if data["danger_count"] >= danger_limit_count:
                                danger_confirmed = True
                            # Track violation for logs - mark current second as having violation
                            current_second = int(current_t)
                            # Extend logs array if needed to accommodate current second
                            while len(following_distance_logs) <= current_second:
                                following_distance_logs.append({"isDetected": False})
                            following_distance_logs[current_second] = {"isDetected": True}
                        else:
                            data["danger_count"] = 0
                        
                        # Positive判定 (リカバリー5m)
                        if dist < self.params["DIST_WARN_M"]:
                            data["entered_warn"] = True
                            data["min_d"] = min(data["min_d"], dist)
                        
                        if data["entered_warn"]:
                            if (dist - data["min_d"]) >= self.params["RECOVERY_THRESHOLD_M"]:
                                positive_confirmed = True
                                data["pos_done"] = True

                        if out:
                            status, color = "SAFE", (0, 255, 0)
                            if dist < self.params["DIST_DANGER_M"]: status, color = "DANGER", (0, 0, 255)
                            elif dist < self.params["DIST_WARN_M"]: status, color = "WARNING", (0, 165, 255)
                            if data["pos_done"]: status, color = "RECOVERED", (255, 255, 0)
                            cv2.rectangle(frame, (int(xc-w/2), int(yc-h/2)), (int(xc+w/2), int(yc+h/2)), color, 2)
                            cv2.putText(frame, f"{dist:.1f}m - {status}", (int(xc-w/2), int(yc-h/2)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            else:
                # Mark tracks as stale but preserve for potential recovery
                for tid in list(track_data.keys()):
                    track_data[tid]["stale_frames"] = track_data[tid].get("stale_frames", 0) + 1
                    if track_data[tid]["stale_frames"] > 5:  # ~0.3s grace at 30fps with skip=2
                        del track_data[tid]
            if out:
                # ガイドライン描画
                c_x = (width/2) + (width * self.params["LANE_OFFSET_X"])
                tw, bw, sy = width * self.params["LANE_TOP_W"], width * self.params["LANE_BOTTOM_W"], height * self.params["LANE_START_Y"]
                pts = np.array([[(c_x-tw/2, sy), (c_x+tw/2, sy), (c_x+bw/2, height), (c_x-bw/2, height)]], dtype=np.int32)
                cv2.polylines(frame, pts, True, (200, 200, 200), 1)
                out.write(frame)

        cap.release()
        if out: out.release()
        
        final_status = "danger" if danger_confirmed else ("positive" if positive_confirmed else "safe")
        return {
            "status": final_status,
            "fps": fps,
            "logs": {
                "followingDistance": following_distance_logs
            },
            "video_duration_seconds": len(following_distance_logs)
        }

    def execute(self, file_name, camera_direction, daylight_period, video_id, company_id, annotate=False, test=False):
        """
        Main execution method for following distance detection.
        """
        from utils.common_utils import generate_and_download_video_clip, create_dashcam_video_path
        from services.api_client import ApiClient
        
        print(f"Starting execution: video_id={video_id}, version={self.params.get('current_version', 'v12.1')}")
        
        try:
            # Step 1: 動画の取得
            if test:
                local_video_path = f"./tmp/{file_name}"
                output_video_path = None 
                if annotate: 
                    os.makedirs("./results", exist_ok=True) 
                    fd, output_video_path = tempfile.mkstemp(prefix="result_", dir="./results", suffix=f"_{file_name}") 
                    os.close(fd)
            else:
                video_path_gcs = create_dashcam_video_path(company_id, video_id, file_name)
                local_video_path = generate_and_download_video_clip(video_path_gcs)
                output_video_path = None 
                if annotate: 
                    fd, output_video_path = tempfile.mkstemp(prefix=f"result_{video_id}_", dir="/tmp", suffix=f"_{file_name}") 
                    os.close(fd)
            
            # Step 2: 動画の解析
            analysis_results = self.analyze_video(local_video_path, output_video_path, annotate=annotate)
            
            final_status = analysis_results["status"]
            print(f"Analysis completed: Status={final_status.upper()}")

            # Step 3: 結果のフォーマット
            response = {
                "result": {
                    "followingDistance": final_status == "danger",
                },
                "fps": analysis_results["fps"],
                "logs": analysis_results["logs"]
            }
            
            if test:
                return response
            
            # Step 4: APIへの送信
            api_client = ApiClient()
            api_client.post(
                "/v1/internal/analyze_result_logs",
                json_data={
                    "result": response,
                    "videoId": video_id,
                    "aiModelName": f"following_distance_v12.1_{CURRENT_YOLO_MODEL_PATH}",
                },
            )
            
            # もしDangerなら動画を特定の場所に保存/アップロードする等の処理をここに追加可能
            
            return response
            
        except Exception as e:
            error_msg = f"Error in FollowingDistanceDetector.execute: {str(e)}"
            print(error_msg)
            if not test:
                if api_client is None:
                    api_client = ApiClient()
                api_client.patch(f"/v1/internal/dashcam_videos/{video_id}", json_data={"analysisStatus": "failed"})
            return {"error": error_msg}
        finally:
            # Clean up downloaded video file
            if local_video_path and not test and os.path.exists(local_video_path):
                try:
                    os.remove(local_video_path)
                    print(f"Cleaned up video file: {local_video_path}")
                except OSError as e:
                    print(f"Warning: Could not remove video file {local_video_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Following Distance Detector Production')
    parser.add_argument('video_path', type=str, help='Input video path')
    parser.add_argument('--annotate', action='store_true', help='Generate annotated video')
    parser.add_argument('--output', '-o', type=str, help='Output video path')
    parser.add_argument('--model', '-m', type=str, default=None, 
                       help='YOLO11 model file name')
    parser.add_argument('--skip', type=int, default=2, help='Process every nth frame')
    parser.add_argument('--test', action='store_true', help='Run in test mode')
    args = parser.parse_args()
    
    detector = FollowingDistanceDetector(model_name=args.model)
    # テスト実行例
    result = detector.execute(
        file_name=os.path.basename(args.video_path),
        camera_direction="outward",
        daylight_period="day",
        video_id="test_id",
        company_id="test_company",
        annotate=args.annotate,
        test=True
    )
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
