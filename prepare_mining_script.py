import json
import os

# Define paths
tp_json_path = 'batch_results_summary.json'
fp_json_path = 'batch_results_summary_fix.json'

# Source buckets
tp_source_bucket = 'gs://yolo-gcp/eagle/infer/input/labeled/seino_following_distance_true/'
fp_source_bucket = 'gs://yolo-gcp/eagle/infer/input/labeled/following_distance_fp_Jan19_Feb5/'

# Destination bucket
dest_bucket = 'gs://yolo-gcp/eagle/infer/input/labeled/retraining_v1_danger_negatives/'

# Load JSONs
with open(tp_json_path, 'r') as f:
    tp_data = json.load(f)

with open(fp_json_path, 'r') as f:
    fp_data = json.load(f)

# Extract lists
tp_files = tp_data['details']['danger']
fp_files = fp_data['details']['danger']

print(f"Found {len(tp_files)} True Positives (to be labeled as Danger)")
print(f"Found {len(fp_files)} False Positives (to be labeled as Safe)")

# Generate copy commands
commands = []

# Copy TPs
for filename in tp_files:
    cmd = f"gsutil cp {tp_source_bucket}{filename} {dest_bucket}danger_{filename}"
    commands.append(cmd)

# Copy FPs (prefix with safe_ to distinguish if names collide, though unlikely given UUIDs)
# Actually, let's keep original names but maybe folder structure? 
# The training script usually expects a flat directory or a CSV.
# Let's just dump them all in one folder. If name collision, we'll see.
# Wait, for training I need LABELS.
# If I dump them in one folder, how does the trainer know which is which?
# The trainer typically takes a dataset YAML or directory structure (e.g. images/train, labels/train).
# BUT, we are retraining on VIDEOS?
# Usually retraining implies we need to generate NEW LABELS for these videos or use existing ones.
# Option C was "Hard Negative Mining (teach model to ignore ghosts)".
# This implies we retrain the CLASSIFIER (if it's a classifier) or the DETECTOR.
# The `following_distance_detection` service seems to be a heuristic on top of object detection?
# Or is it an end-to-end video classifier?
# Based on previous context, it seems to be a "following distance" logic.
# If it's logic-based, we can't "retrain" it unless we tune parameters.
# BUT, the user said "Option C: Retrain Main YOLO".
# That means we need to fine-tune the YOLO object detector (likely to reduce false positive vehicle detections or improve distance estimation?).
# OR, maybe the "following distance" IS a classification model?
# "following_distance_infer" suggests it infers a state.
# Let's assume we need to prepare the data for a YOLO training run.
# That requires FRAME EXTRACTION and LABELLING.
# We have 784 videos. We can't label them all manually.
# Ah, the "Hard Negatives" are "Ghosts".
# That implies the model is detecting "cars" where there are none (e.g. reflections, shadows).
# So we need to feed these "Safe" videos (where NO car is following) and tell the model "NOTHING HERE".
# And feed the "Danger" videos (where a car IS following) and say "CAR HERE".
# IF we are retraining YOLO, we need bounded boxes.
# If we provide empty images (no bounding boxes) for the False Positives, the model learns to suppress detections there.
# So, the plan:
# 1. Extract frames from the False Positive videos.
# 2. Create empty label files for those frames.
# 3. Extract frames from the True Positive videos.
# 4. We need bounding boxes for the True Positives. Do we have them?
#    Likely we used a pre-trained model. We might need to run inference to get "pseudo-labels" and then correct them? 
#    Or just use the FPs as "background" images?
#    "Hard Negative Mining" usually focuses on the background.
#    Maybe we just add the FP frames as "background images" to the dataset?
#    Yes, ultralytics YOLO supports background images (images with no labels).
# So the critical part is adding the FP videos (converted to frames) as background images.
# The TP videos... we probably already have a training set for cars?
# Or maybe we just add the FP frames to the existing dataset.

# Let's start by consolidating the videos. That's a safe first step.
# I will create a script to copy them to `gs://yolo-gcp/eagle/infer/input/labeled/retraining_v1_fp_background/` (focusing on the FPs first).
# The TPs might be needed for validation or balance, but the FPs are the "mining" part.

# Updated Plan:
# 1. Copy FP videos to `gs://.../retraining_v1_fp_background/`
# 2. Extract frames (we can run a batch job for this).
# 3. Add to training set.

# Let's generate the copy commands for just the FPs for now, as that's the "Mining" part.
# I'll also copy the TPs to `gs://.../retraining_v1_tp_validation/` to have them handy.

with open('copy_mining_data.sh', 'w') as f:
    f.write("#!/bin/bash\n")
    f.write("echo 'Copying False Positives (Hard Negatives)...'\n")
    # Use gsutil -m cp -I to read from stdin for efficiency if possible, or just huge list
    # Actually, generating 500 commands is fine.
    for filename in fp_files:
        f.write(f"gsutil cp {fp_source_bucket}{filename} {dest_bucket}fp/{filename}\n")
    
    f.write("echo 'Copying True Positives (Validation)...'\n")
    for filename in tp_files:
        f.write(f"gsutil cp {tp_source_bucket}{filename} {dest_bucket}tp/{filename}\n")

