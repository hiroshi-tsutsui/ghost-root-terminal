import os
import random
from collections import defaultdict

dataset_v5_path = "/Users/tsutsuihiroshi/Documents/github/dotsfty/dotsfty-hub/dot-sfty-workbench/classification/dataset_v5"
train_path = os.path.join(dataset_v5_path, "train")

def process_class_uuid_limit(class_name, limit=5):
    cls_dir = os.path.join(train_path, class_name)
    files = os.listdir(cls_dir)
    uuid_groups = defaultdict(list)
    
    # clip-UUID_... 形式のUUIDを抽出
    for f in files:
        if "clip-" in f:
            parts = f.split('_')
            # clip-UUID の UUID 部分を抽出 (clip- の後ろから最初のアンダーバーまで)
            # 例: clip-0eacbce2-bd66-4d4c-bfb9-34f2ef62b89e_...
            uuid = f.split('_')[0].replace("clip-", "")
            uuid_groups[uuid].append(f)
        else:
            # UUIDがないものはそのまま維持候補へ
            pass

    to_delete = []
    kept_count = 0

    for uuid, fs in uuid_groups.items():
        if len(fs) > limit:
            random.shuffle(fs)
            to_keep = fs[:limit]
            to_delete.extend(fs[limit:])
            kept_count += len(to_keep)
        else:
            kept_count += len(fs)

    print(f"Class {class_name}: Limiting UUIDs to {limit}. Keeping {kept_count}, Deleting {len(to_delete)} from {len(uuid_groups)} unique clips.")
    
    for f in to_delete:
        os.remove(os.path.join(cls_dir, f))

if __name__ == "__main__":
    print("Starting Dataset V5 Optimization (UUID Limit: 5)...")
    # phone と cigarette に対して UUID ごとの枚数を 5枚に制限
    process_class_uuid_limit("phone", limit=5)
    process_class_uuid_limit("cigarette", limit=5)
    print("Done.")
