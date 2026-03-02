import os
import random
import shutil

dataset_v6_path = "/Users/tsutsuihiroshi/Documents/github/dotsfty/dotsfty-hub/dot-sfty-workbench/classification/dataset_v6"
train_path = os.path.join(dataset_v6_path, "train")

def get_count(class_name):
    return len(os.listdir(os.path.join(train_path, class_name)))

def downsample_to(class_name, target_count):
    cls_dir = os.path.join(train_path, class_name)
    files = [f for f in os.listdir(cls_dir) if os.path.isfile(os.path.join(cls_dir, f))]
    
    if len(files) <= target_count:
        print(f"Class {class_name}: Already at {len(files)} (Target: {target_count}). No action.")
        return

    random.shuffle(files)
    to_delete = files[target_count:]
    
    print(f"Class {class_name}: Downsampling from {len(files)} to {target_count}. Deleting {len(to_delete)}.")
    
    for f in to_delete:
        os.remove(os.path.join(cls_dir, f))

if __name__ == "__main__":
    others_count = get_count("others")
    print(f"Reference (others) count: {others_count}")
    
    # phone と cigarette を others と同数までダウンサンプリング
    downsample_to("phone", others_count)
    downsample_to("cigarette", others_count)
    
    print("V6 Balanced Downsampling Complete.")
