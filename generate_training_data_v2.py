import argparse
import os
import cv2
try:
    from ultralytics import YOLO
except ImportError:
    print("ultralytics not found, installing...")
    os.system("pip install ultralytics")
    from ultralytics import YOLO
import glob

def process_videos(input_dir, output_dir, mode='tp'):
    print(f"Starting processing in mode: {mode}")
    # Load model (assume default path in container or download)
    try:
        model = YOLO("yolo11x.pt")  # Or whatever model we are using
    except Exception as e:
        print(f"Error loading model: {e}")
        # fallback or exit
        return

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
            
            # We must save the label file even if empty, so the trainer knows it's a background image (if empty)
            with open(label_path, 'w') as f:
                for box in results.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    xywhn = box.xywhn[0].tolist()
                    
                    if mode == 'fp':
                        # Aggressive Ghost Removal:
                        # If detecting ANY vehicle in a "Safe" video, assume it's a ghost or distant irrelevant car.
                        # Since we want to teach "Background", removing ALL detections is the safest hard negative strategy.
                        # If there *was* a real car, the user wouldn't have marked it "Safe" (unless very far).
                        # Let's remove ALL vehicle detections for FP videos to treat them as pure background.
                        # Classes: 2 (Car), 3 (Motorcycle), 5 (Bus), 7 (Truck)
                        if cls in [2, 3, 5, 7]:
                            continue 
                            
                    f.write(f"{cls} {xywhn[0]} {xywhn[1]} {xywhn[2]} {xywhn[3]} {conf}\n")
            
            # Save frame image (needed for training)
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
