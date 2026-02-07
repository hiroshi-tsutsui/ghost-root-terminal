import os
import sys
import json
import logging
import random
# import cv2
# import torch

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def process_video(video_path, output_path):
    logging.info(f"Processing video: {video_path}")
    
    # Check if video exists
    if not os.path.exists(video_path):
        logging.error(f"Video file not found: {video_path}")
        return

    # Mocking the Detection + Depth Fusion Logic
    # Ideally: model = YOLO('yolov10.pt')
    
    results = []
    
    # Simulate frame processing
    frame_count = 20 # Mock frame count for speed
    
    for i in range(frame_count):
        # Simulate a detection logic based on "False Positive Analysis"
        
        # 20% chance of a "Ghost" (Geometric Illusion)
        is_illusion = random.random() < 0.2
        
        if is_illusion:
            # Illusion: Box looks close (geo distance small) but Depth says far
            detection = {
                "frame": i,
                "bbox": [100, 100, 150, 150],
                "class": "car",
                "confidence": 0.85,
                "geometric_dist": random.uniform(8.0, 12.0), # Unsafe?
                "depth_v3_dist": random.uniform(45.0, 55.0), # Safe
            }
        else:
            # Consensus: Real object
            dist = random.uniform(10.0, 100.0)
            detection = {
                "frame": i,
                "bbox": [200, 200, 300, 300],
                "class": "car",
                "confidence": 0.95,
                "geometric_dist": dist + random.uniform(-1, 1),
                "depth_v3_dist": dist + random.uniform(-1, 1),
            }
        
        # Fusion Logic V11 (The Logic we are testing)
        if detection['class'] == 'car':
            geo = detection['geometric_dist']
            depth = detection['depth_v3_dist']
            
            # Conflict resolution
            if abs(geo - depth) > 20.0:
                logging.warning(f"Frame {i}: Distance discrepancy detected (Geo: {geo:.2f}m, Depth: {depth:.2f}m)")
                
                # Logic Tweak: If low confidence or small box, trust Depth
                # For now, blindly trust Depth V3 if discrepancy is huge
                final_dist = depth
                reason = "Depth V3 Override (High Confidence)"
            else:
                final_dist = geo
                reason = "Geometric Consensus"
            
            is_safe = final_dist > 30.0 # Threshold
            
            result = {
                "frame": i,
                "status": "SAFE" if is_safe else "WARNING",
                "distance": final_dist,
                "reason": reason,
                "raw_detection": detection
            }
            results.append(result)
            
    # Save results to JSON
    video_filename = os.path.basename(video_path)
    output_filename = f"analysis_{video_filename}.json"
    full_output_path = os.path.join(output_path, output_filename)
    
    # Ensure dir
    os.makedirs(output_path, exist_ok=True)
    
    try:
        with open(full_output_path, 'w') as f:
            json.dump(results, f, indent=2)
        logging.info(f"Saved results to {full_output_path}")
    except Exception as e:
        logging.error(f"Failed to write output: {e}")

if __name__ == "__main__":
    
    # Environment & Paths
    MOUNT_SHARE = "/mnt/disks/share"
    MOUNT_MEDIA = "/mnt/disks/media"
    
    # Input List
    VIDEO_LIST_PATH = os.path.join(MOUNT_SHARE, "fp_videos_list.txt")
    
    # Output Dir
    OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", os.path.join(MOUNT_SHARE, "output/v11_test/"))
    
    # Batch Params
    try:
        # Batch injects BATCH_TASK_INDEX
        TASK_INDEX = int(os.environ.get("BATCH_TASK_INDEX", 0))
        # We inject BATCH_TASK_COUNT in JSON
        TASK_COUNT = int(os.environ.get("BATCH_TASK_COUNT", 1))
    except ValueError:
        TASK_INDEX = 0
        TASK_COUNT = 1
        
    logging.info(f"Task Started. Index: {TASK_INDEX}, Count: {TASK_COUNT}")
    
    if not os.path.exists(VIDEO_LIST_PATH):
        logging.error(f"Video list not found at {VIDEO_LIST_PATH}")
        sys.exit(1)
        
    # Read Video List
    all_videos = []
    with open(VIDEO_LIST_PATH, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip header lines or empty lines
            if not line: continue
            if "gs_url" in line or "---" in line: continue
            
            # Convert gs:// url to local mount path
            # gs://media.dotsfty.com/path -> /mnt/disks/media/path
            if line.startswith("gs://media.dotsfty.com/"):
                local_path = line.replace("gs://media.dotsfty.com/", MOUNT_MEDIA + "/")
                all_videos.append(local_path)
            else:
                # Handle other paths or assume already local if testing
                all_videos.append(line)
                
    logging.info(f"Total videos in list: {len(all_videos)}")
    
    # Sharding
    my_videos = [v for i, v in enumerate(all_videos) if i % TASK_COUNT == TASK_INDEX]
    logging.info(f"Processing {len(my_videos)} videos in this task.")
    
    for video in my_videos:
        process_video(video, OUTPUT_BUCKET)
        
    logging.info("Task Complete.")
