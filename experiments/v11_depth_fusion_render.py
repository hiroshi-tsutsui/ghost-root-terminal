import os
import sys
import logging
import cv2
import numpy as np
import random
import time

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
            
            # Translation logic
            # gs://yolo-gcp/foo/bar.mp4 -> /mnt/disks/data/foo/bar.mp4
            if line.startswith("gs://yolo-gcp/"):
                relative_path = line.replace("gs://yolo-gcp/", "")
                local_path = os.path.join(mount_data, relative_path)
                videos.append(local_path)
            else:
                # Fallback or other buckets
                videos.append(line)
    return videos

def estimate_geo_dist(bbox, frame_height):
    """
    Rough estimation of geometric distance based on bbox height.
    Assumption: Car height ~1.5m, Focal Length ~1000px (arbitrary for demo)
    dist = (real_height * focal_length) / pixel_height
    """
    _, _, _, h = bbox
    if h <= 0: return 100.0
    # Mock calibration
    focal_length = 1000.0 
    real_height = 1.5 
    dist = (real_height * focal_length) / h
    return dist

def simulate_depth_dist(geo_dist, frame_width, bbox):
    """
    Simulate a depth sensor reading.
    - 80% chance: Matches Geo distance (+- noise)
    - 20% chance: Disagrees (Ghost/Illusion scenario)
    """
    # Deterministic randomness based on bbox position to keep it stable across frames if possible,
    # but for simple rendering, random per frame is okay if it flickers, 
    # though stable is better. We'll use random for now but smooth it if we had a tracker.
    
    # Let's make it consistent for a specific "mock" scenario
    # If the box is in the center, maybe it's real.
    # If it's on the edge, maybe it's a ghost?
    
    # For visual proof, we want to see both cases.
    # Let's randomly pick a mode for each detection instance if we could track,
    # but without tracking, we'll just randomly glitch it occasionally.
    
    if random.random() < 0.15:
        # Illusion: Geo says X, Depth says X + 40m (Safe)
        return geo_dist + 40.0 + random.uniform(-2, 2)
    else:
        # Consensus
        return geo_dist + random.uniform(-2, 2)

def process_video(video_path, output_dir, model=None):
    if not os.path.exists(video_path):
        logging.error(f"Video file does not exist: {video_path}")
        return

    filename = os.path.basename(video_path)
    output_path = os.path.join(output_dir, f"rendered_{filename}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logging.error(f"Could not open video: {video_path}")
        return

    # Video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Limit frames for demo speed (first 300 frames / 10 seconds)
    max_frames = 300
    
    # Video Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_idx = 0
    while cap.isOpened() and frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
            
        detections = []
        
        if YOLO_AVAILABLE and model:
            # Run Inference
            results = model(frame, verbose=False)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    # xywh
                    b = box.xywh[0].cpu().numpy() # x_center, y_center, w, h
                    # xyxy for drawing
                    b_xyxy = box.xyxy[0].cpu().numpy()
                    
                    # Estimate Distances
                    geo_dist = estimate_geo_dist(b, height)
                    depth_dist = simulate_depth_dist(geo_dist, width, b)
                    
                    detections.append({
                        "bbox": b_xyxy,
                        "geo": geo_dist,
                        "depth": depth_dist
                    })
        else:
            # Mock Detection (Moving Bouncing Box)
            # Create a box moving diagonally
            x = (frame_idx * 5) % width
            y = (frame_idx * 3) % height
            w, h = 100, 100
            
            geo_dist = 15.0 if (frame_idx % 60 < 30) else 45.0 # Alternating near/far
            depth_dist = geo_dist # Usually agrees
            
            # Inject discrepancy occasionally
            if frame_idx % 100 > 80:
                geo_dist = 10.0 # Looks close
                depth_dist = 50.0 # Sensor says far (Ghost)
            
            detections.append({
                "bbox": [x, y, x+w, y+h],
                "geo": geo_dist,
                "depth": depth_dist
            })

        # Draw Overlays
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            geo = det['geo']
            depth = det['depth']
            
            # V11 LOGIC
            # Conflict resolution
            if abs(geo - depth) > 20.0:
                final_dist = depth
                reason = "Depth Override"
                # Override implies we trust depth. 
                # If depth is Safe (large), we mark Safe.
            else:
                final_dist = geo
                reason = "Geo Consensus"
            
            is_safe = final_dist > 30.0
            
            # Color: Green if Safe, Red if Warning
            color = (0, 255, 0) if is_safe else (0, 0, 255)
            status_text = "SAFE" if is_safe else "WARNING"
            
            # Draw Box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw Label Background
            label = f"{status_text} | Geo: {geo:.1f}m | Depth: {depth:.1f}m"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(frame, (x1, y1 - 25), (x1 + tw, y1), color, -1)
            
            # Draw Text
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Draw Logic Reason (Subtitle)
            cv2.putText(frame, reason, (x1, y2 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        out.write(frame)
        frame_idx += 1
        
        if frame_idx % 50 == 0:
            logging.info(f"Processed {frame_idx} frames for {filename}")

    cap.release()
    out.release()
    logging.info(f"Saved video to {output_path}")

def main():
    # Paths
    MOUNT_SHARE = "/mnt/disks/share"
    MOUNT_DATA = "/mnt/disks/data"
    
    # Env vars
    OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "/mnt/disks/data/output/v11_render_test")
    LIST_FILE = os.path.join(MOUNT_SHARE, "fp_videos_list_v2.txt")
    
    # Ensure output dir
    os.makedirs(OUTPUT_BUCKET, exist_ok=True)
    
    # Load Model (if available)
    model = None
    if YOLO_AVAILABLE:
        try:
            # Try loading a standard model, hoping it downloads or exists
            # We use 'yolov8n.pt' as a lightweight default. 
            # If no internet and no cache, this might fail.
            logging.info("Loading YOLOv8n model...")
            model = YOLO('yolov8n.pt') 
        except Exception as e:
            logging.error(f"Failed to load YOLO model: {e}")
            logging.warning("Falling back to Mock Detector.")
            model = None

    # Get Videos
    videos = get_video_paths(LIST_FILE, MOUNT_DATA)
    logging.info(f"Found {len(videos)} videos.")
    
    # Batch Processing Logic (Simple Sharding)
    try:
        TASK_INDEX = int(os.environ.get("BATCH_TASK_INDEX", 0))
        TASK_COUNT = int(os.environ.get("BATCH_TASK_COUNT", 1))
    except:
        TASK_INDEX = 0
        TASK_COUNT = 1
        
    my_videos = [v for i, v in enumerate(videos) if i % TASK_COUNT == TASK_INDEX]
    logging.info(f"This task processing {len(my_videos)} videos.")
    
    for video in my_videos:
        try:
            process_video(video, OUTPUT_BUCKET, model)
        except Exception as e:
            logging.error(f"Error processing {video}: {e}")

if __name__ == "__main__":
    main()
