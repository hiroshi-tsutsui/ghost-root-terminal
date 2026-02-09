import argparse
import os
import cv2
from ultralytics import YOLO
import glob

def process_videos(input_dir, output_dir, mode='tp'):
    # Load model (assume default path in container or download)
    model = YOLO("yolo11x.pt")  # Or whatever model we are using
    
    video_files = glob.glob(os.path.join(input_dir, "*.mp4"))
    
    for video_path in video_files:
        cap = cv2.VideoCapture(video_path)
        frame_idx = 0
        base_name = os.path.basename(video_path).replace(".mp4", "")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Run inference
            results = model(frame, verbose=False)[0]
            
            # Save labels
            label_path = os.path.join(output_dir, f"{base_name}_{frame_idx:06d}.txt")
            
            with open(label_path, 'w') as f:
                for box in results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    xywhn = box.xywhn[0].tolist()
                    
                    # Logic for filtering
                    # If mode is FP, we want to REMOVE the "Danger" box.
                    # Simple heuristic: The largest box in the center lane is usually the danger one.
                    # Center lane approx: x_center between 0.3 and 0.7?
                    # Large box: width > 0.1? height > 0.1?
                    # Let's assume if confidence is high but user said it's safe (FP), it's a ghost.
                    
                    if mode == 'fp':
                        # If box is "large" and "central", skip it (it's the ghost).
                        # Let's be aggressive: If it looks like a car nearby, kill it.
                        if cls in [2, 3, 5, 7]: # Car, motorcycle, bus, truck
                            if xywhn[2] > 0.1 and xywhn[3] > 0.1: # Reasonably big
                                continue # SKIP IT (Remove label)
                            
                    # If mode is TP, keep all valid detections.
                    f.write(f"{cls} {xywhn[0]} {xywhn[1]} {xywhn[2]} {xywhn[3]} {conf}\n")
            
            # Save frame image (needed for training)
            img_path = os.path.join(output_dir, f"{base_name}_{frame_idx:06d}.jpg")
            cv2.imwrite(img_path, frame)
            
            frame_idx += 1
        
        cap.release()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", required=True)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--mode", required=True, choices=['tp', 'fp'])
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    process_videos(args.input_dir, args.output_dir, args.mode)
