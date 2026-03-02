import os
import random
import shutil
from collections import defaultdict

dataset_path = "/Users/tsutsuihiroshi/Documents/github/dotsfty/dotsfty-hub/dot-sfty-workbench/classification/dataset"
train_path = os.path.join(dataset_path, "train")

def process_others():
    others_dir = os.path.join(train_path, "others")
    files = os.listdir(others_dir)
    video_files = defaultdict(list)
    non_video_files = []

    for f in files:
        if "video_" in f:
            # video_[UUID]_...
            parts = f.split('_')
            if len(parts) > 1:
                uuid = parts[1]
                video_files[uuid].append(f)
            else:
                non_video_files.append(f)
        else:
            non_video_files.append(f)

    to_keep = []
    to_delete = []

    # UUIDごとに1枚に絞る
    for uuid, fs in video_files.items():
        chosen = random.choice(fs)
        to_keep.append(chosen)
        to_delete.extend([f for f in fs if f != chosen])

    print(f"Others: Keeping {len(to_keep)} video files (from {len(video_files)} UUIDs), Deleting {len(to_delete)}")
    
    for f in to_delete:
        os.remove(os.path.join(others_dir, f))

def process_positive(class_name):
    cls_dir = os.path.join(train_path, class_name)
    files = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
    
    # 1/3を削除 (2/3を残す)
    num_to_keep = int(len(files) * (2/3))
    random.shuffle(files)
    to_delete = files[num_to_keep:]
    
    print(f"{class_name.capitalize()}: Keeping {num_to_keep}, Deleting {len(to_delete)}")
    
    for f in to_delete:
        os.remove(os.path.join(cls_dir, f))

if __name__ == "__main__":
    print("Starting Dataset V4 Optimization...")
    process_others()
    process_positive("phone")
    process_positive("cigarette")
    print("Done.")
