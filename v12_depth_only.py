import os
import sys
import logging
import cv2
import numpy as np
import random
import time
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Try importing YOLO, handle failure gracefully
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    logging.warning("Ultralytics YOLO not installed. Using Mock Detector.")
    YOLO_AVAILABLE = False

def get_video_paths(list_path, mount_data):
    """
    Reads the video list and translates gs://yolo-gcp/ paths to local mount paths.
    """
    videos = []
    if not os.path.exists(list_path):
        logging.error(f"List file not found: {list_path}")
        return videos

    with open(list_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            if line.startswith("gs://yolo-gcp/"):
                relative_path = line.replace("gs://yolo-gcp/", "")
                local_path = os.path.join(mount_data, relative_path)
                videos.append(local_path)
            else:
                videos.append(line)
    return videos

def estimate_geo_dist(bbox, frame_height):
    _, _, _, h = bbox
    if h <= 0: return 100.0
    focal_length = 1000.0 
    real_height = 1.5 
    dist = (real_height * focal_length) / h
    return dist

def simulate_depth_dist(geo_dist, frame_width, bbox):
    # Mock simulation
    if random.random() < 0.15:
        return geo_dist + 40.0 + random.uniform(-2, 2)
    else:
        return geo_dist + random.uniform(-2, 2)

def process_video(video_path, output_dir, model=None):
    if not os.path.exists(video_path):
        logging.error(f"Video file does not exist: {video_path}")
        return "ERROR"

    filename = os.path.basename(video_path)
    output_path = os.path.join(output_dir, f"v12_depth_only_{filename}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logging.error(f"Could not open video: {video_path}")
        return "ERROR"

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    max_frames = 300 # Limit for speed
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_idx = 0
    
    # Classification logic:
    # If ANY frame is "Warning" (Red), the video is classified as WARNING.
    # Otherwise, it is SAFE.
    video_is_safe = True
    
    while cap.isOpened() and frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
            
        detections = []
        
        if YOLO_AVAILABLE and model:
            results = model(frame, verbose=False)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    b = box.xywh[0].cpu().numpy() # x,y,w,h
                    b_xyxy = box.xyxy[0].cpu().numpy() # x1,y1,x2,y2
                    
                    geo_dist = estimate_geo_dist(b, height)
                    depth_dist = simulate_depth_dist(geo_dist, width, b)
                    
                    detections.append({
                        "bbox": b_xyxy,
                        "geo": geo_dist,
                        "depth": depth_dist
                    })
        else:
            # Mock Detection Logic
            x = (frame_idx * 5) % width
            y = (frame_idx * 3) % height
            w, h = 100, 100
            geo_dist = 15.0 if (frame_idx % 60 < 30) else 45.0
            depth_dist = geo_dist
            if frame_idx % 100 > 80:
                geo_dist = 10.0
                depth_dist = 50.0 # Ghost
            
            detections.append({
                "bbox": [x, y, x+w, y+h],
                "geo": geo_dist,
                "depth": depth_dist
            })

        # Render Detections
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            geo = det['geo']
            depth = det['depth']
            
            # V12 LOGIC: DEPTH ONLY (Ignore Geometric)
            final_dist = depth
            reason = "Depth Only (V12)"
            
            is_safe = final_dist > 30.0
            if not is_safe:
                video_is_safe = False
            
            color = (0, 255, 0) if is_safe else (0, 0, 255)
            status_text = "SAFE" if is_safe else "WARNING"
            
            # Draw
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"{status_text} | Depth: {depth:.1f}m"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(frame, (x1, y1 - 25), (x1 + tw, y1), color, -1)
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, reason, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        out.write(frame)
        frame_idx += 1

    cap.release()
    out.release()
    
    return "SAFE" if video_is_safe else "WARNING"

def main():
    MOUNT_SHARE = "/mnt/disks/share"
    MOUNT_DATA = "/mnt/disks/data"
    OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "/mnt/disks/data/output/v11_render_test")
    LIST_FILE = os.path.join(MOUNT_SHARE, "fp_videos_list_v2.txt")
    
    os.makedirs(OUTPUT_BUCKET, exist_ok=True)
    
    model = None
    if YOLO_AVAILABLE:
        try:
            logging.info("Loading YOLOv8n model...")
            model = YOLO('yolov8n.pt') 
        except Exception:
            logging.warning("Failed to load YOLO. Using Mock.")
            model = None

    videos = get_video_paths(LIST_FILE, MOUNT_DATA)
    
    # Task Sharding
    try:
        TASK_INDEX = int(os.environ.get("BATCH_TASK_INDEX", 0))
        TASK_COUNT = int(os.environ.get("BATCH_TASK_COUNT", 1))
    except:
        TASK_INDEX = 0
        TASK_COUNT = 1
        
    my_videos = [v for i, v in enumerate(videos) if i % TASK_COUNT == TASK_INDEX]
    total_videos = len(my_videos)
    
    logging.info(f"Task {TASK_INDEX}/{TASK_COUNT}: Processing {total_videos} videos.")
    
    # Stats Counters
    stats = Counter()
    
    for i, video in enumerate(my_videos, start=1):
        filename = os.path.basename(video)
        # Progress Log
        logging.info(f"[{i}/{total_videos}] Processing {filename}...")
        
        try:
            status = process_video(video, OUTPUT_BUCKET, model)
            stats[status] += 1
            logging.info(f"    -> Finished {filename}: {status}")
        except Exception as e:
            logging.error(f"Error processing {video}: {e}")
            stats["ERROR"] += 1

    # Final Summary Table
    print("\n" + "="*40)
    print(f" FINAL SUMMARY (Task {TASK_INDEX})")
    print("="*40)
    print(f" TOTAL PROCESSED : {total_videos}")
    print(f" SAFE            : {stats['SAFE']}")
    print(f" WARNING         : {stats['WARNING']}")
    print(f" ERRORS          : {stats['ERROR']}")
    print("="*40 + "\n")

if __name__ == "__main__":
    main()
