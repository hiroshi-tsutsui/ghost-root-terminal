import os
import sys
import logging
import cv2
import numpy as np
import torch
from transformers import pipeline
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- MODEL LOADING ---
YOLO_AVAILABLE = False
DEPTH_AVAILABLE = False
yolo_model = None
depth_pipe = None

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    logging.info("YOLO library found.")
except ImportError:
    logging.warning("Ultralytics YOLO not installed.")

try:
    # Check if transformers is available
    import transformers
    logging.info(f"Transformers version: {transformers.__version__}")
    
    # Initialize Depth Anything Pipeline
    device = 0 if torch.cuda.is_available() else -1
    logging.info(f"Loading Depth Anything (Small) on device {device}...")
    depth_pipe = pipeline(task="depth-estimation", model="LiheYoung/depth-anything-small-hf", device=device)
    DEPTH_AVAILABLE = True
    logging.info("Depth Anything loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load Depth Anything: {e}")
    DEPTH_AVAILABLE = False

def get_video_paths(list_path, mount_data):
    videos = []
    if not os.path.exists(list_path):
        logging.error(f"List file not found: {list_path}")
        return videos

    with open(list_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"): continue
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

def get_real_depth(pipe, frame, bbox):
    """
    Runs Depth Anything on the cropped vehicle.
    Returns an estimated distance (heuristic calibration).
    """
    if not pipe:
        return 0.0
        
    x1, y1, x2, y2 = map(int, bbox)
    h, w, _ = frame.shape
    
    # Safety clamp
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    
    if x2 <= x1 or y2 <= y1:
        return 0.0
        
    # Crop
    crop = frame[y1:y2, x1:x2]
    pil_image = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    
    # Inference
    depth_output = pipe(pil_image)
    depth_tensor = depth_output["predicted_depth"] # tensor or image depending on version
    
    # If pipeline returns Image, convert to array
    if not isinstance(depth_tensor, torch.Tensor):
         # The HF pipeline usually returns a dict with 'depth' as PIL Image for depth-estimation
         # specifically for Depth Anything, it returns "depth" (PIL) or "predicted_depth" (tensor)
         # Let's handle the standard "depth" key which is common.
         if "depth" in depth_output:
             d_img = depth_output["depth"]
             d_arr = np.array(d_img)
             # Invert: Brighter is closer (usually). 
             # Depth Anything output: High value = Close.
             mean_disp = np.mean(d_arr)
         else:
             mean_disp = 128.0 # Fallback
    else:
         mean_disp = torch.mean(depth_tensor).item()

    # Heuristic: Distance ~ 1 / Disparity
    # We need a scalar to make it roughly "meters". 
    # Let's tune it so a medium car (disp ~150) is ~15m.
    # 15m = Scalar / 150  -> Scalar = 2250.
    if mean_disp < 1: mean_disp = 1
    
    est_dist = 2500.0 / mean_disp 
    return est_dist

def process_video(video_path, output_dir, yolo_model, depth_pipe):
    if not os.path.exists(video_path):
        return "ERROR"

    filename = os.path.basename(video_path)
    output_path = os.path.join(output_dir, f"v13_real_{filename}")
    
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    max_frames = 300 
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_idx = 0
    video_is_safe = True
    
    while cap.isOpened() and frame_idx < max_frames:
        ret, frame = cap.read()
        if not ret: break
            
        detections = []
        
        if yolo_model:
            results = yolo_model(frame, verbose=False)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    b_xyxy = box.xyxy[0].cpu().numpy()
                    
                    # 1. Geo
                    geo_dist = estimate_geo_dist(box.xywh[0].cpu().numpy(), height)
                    
                    # 2. Real Depth
                    if depth_pipe:
                        real_depth = get_real_depth(depth_pipe, frame, b_xyxy)
                        source = "Real AI"
                    else:
                        real_depth = geo_dist # Fallback
                        source = "Fallback"

                    detections.append({
                        "bbox": b_xyxy,
                        "geo": geo_dist,
                        "depth": real_depth,
                        "source": source
                    })

        # Render
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            geo = det['geo']
            depth = det['depth']
            
            # V13 Logic: Trust Depth
            is_safe = depth > 30.0
            if not is_safe: video_is_safe = False
            
            color = (0, 255, 0) if is_safe else (0, 0, 255)
            status = "SAFE" if is_safe else "WARNING"
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"{status} | D:{depth:.1f}m (G:{geo:.1f}m)"
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        out.write(frame)
        frame_idx += 1

    cap.release()
    out.release()
    return "SAFE" if video_is_safe else "WARNING"

def main():
    MOUNT_SHARE = "/mnt/disks/share"
    MOUNT_DATA = "/mnt/disks/data"
    OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "/mnt/disks/data/output/v13_real_test")
    LIST_FILE = os.path.join(MOUNT_SHARE, "fp_videos_list_v2.txt")
    
    os.makedirs(OUTPUT_BUCKET, exist_ok=True)
    
    # Load Models
    model = None
    if YOLO_AVAILABLE:
        try:
            logging.info("Loading YOLOv8n...")
            model = YOLO('yolov8n.pt') 
        except:
            logging.error("YOLO load failed.")
            
    videos = get_video_paths(LIST_FILE, MOUNT_DATA)
    
    # Sharding
    try:
        TASK_INDEX = int(os.environ.get("BATCH_TASK_INDEX", 0))
        TASK_COUNT = int(os.environ.get("BATCH_TASK_COUNT", 1))
    except:
        TASK_INDEX = 0; TASK_COUNT = 1
        
    my_videos = [v for i, v in enumerate(videos) if i % TASK_COUNT == TASK_INDEX]
    logging.info(f"Task {TASK_INDEX} processing {len(my_videos)} videos.")
    
    for i, video in enumerate(my_videos):
        logging.info(f"[{i+1}/{len(my_videos)}] {os.path.basename(video)}")
        try:
            process_video(video, OUTPUT_BUCKET, model, depth_pipe)
        except Exception as e:
            logging.error(f"Failed {video}: {e}")

if __name__ == "__main__":
    main()
