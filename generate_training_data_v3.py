import argparse
import os
import cv2
import sys
import glob

def process_videos(input_dir, output_dir, mode='tp'):
    print(f"Starting processing in mode: {mode}")
    
    # Try importing ultralytics
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Ultralytics not installed. Installing...")
        os.system("pip install ultralytics")
        from ultralytics import YOLO

    # Load model (assume default path in container or download)
    try:
        # If we are in the container, it might need download.
        # But maybe we need to specify a model name that exists or download it.
        # "yolo11x.pt" might not be available if internet access is restricted or not pre-downloaded.
        # Let's try downloading 'yolo11n.pt' (smaller) if x fails, or just 'yolov8n.pt'
        # Or better, check if we can download.
        model_name = "yolo11x.pt" 
        if not os.path.exists(model_name):
             print(f"Model {model_name} not found locally. Ultralytics should auto-download.")
        
        model = YOLO(model_name)
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

    video_files = glob.glob(os.path.join(input_dir, "*.mp4"))
    print(f"Found {len(video_files)} videos in {input_dir}")
    
    if not video_files:
        print("No videos found! Checking directory contents:")
        os.system(f"ls -F {input_dir}")
        return

    for video_path in video_files:
        cap = cv2.VideoCapture(video_path)
        frame_idx = 0
        base_name = os.path.basename(video_path).replace(".mp4", "")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Skip frames to speed up? Every 5th frame?
            if frame_idx % 5 != 0:
                frame_idx += 1
                continue
                
            # Run inference
            results = model(frame, verbose=False)[0]
            
            # Save labels
            label_path = os.path.join(output_dir, f"{base_name}_{frame_idx:06d}.txt")
            
            # We must save the label file even if empty
            with open(label_path, 'w') as f:
                for box in results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    xywhn = box.xywhn[0].tolist()
                    
                    if mode == 'fp':
                        # Aggressive Ghost Removal: Remove vehicle detections
                        if cls in [2, 3, 5, 7]:
                            continue 
                            
                    f.write(f"{cls} {xywhn[0]} {xywhn[1]} {xywhn[2]} {xywhn[3]} {conf}\n")
            
            # Save frame image
            img_path = os.path.join(output_dir, f"{base_name}_{frame_idx:06d}.jpg")
            cv2.imwrite(img_path, frame)
            
            frame_idx += 1
        
        cap.release()
    print("Processing complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", required=True)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--mode", required=True, choices=['tp', 'fp'])
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    process_videos(args.input_dir, args.output_dir, args.mode)
