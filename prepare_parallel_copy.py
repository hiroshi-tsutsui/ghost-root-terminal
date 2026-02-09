import json

# Define paths
tp_json_path = 'batch_results_summary.json'
fp_json_path = 'batch_results_summary_fix.json'

# Source buckets
tp_source_bucket = 'gs://yolo-gcp/eagle/infer/input/labeled/seino_following_distance_true/'
fp_source_bucket = 'gs://yolo-gcp/eagle/infer/input/labeled/following_distance_fp_Jan19_Feb5/'

# Load JSONs
with open(tp_json_path, 'r') as f:
    tp_data = json.load(f)

with open(fp_json_path, 'r') as f:
    fp_data = json.load(f)

# Extract lists
tp_files = tp_data['details']['danger']
fp_files = fp_data['details']['danger']

# Generate file lists for gsutil -I
with open('fp_file_list.txt', 'w') as f:
    for filename in fp_files:
        f.write(f"{fp_source_bucket}{filename}\n")

with open('tp_file_list.txt', 'w') as f:
    for filename in tp_files:
        f.write(f"{tp_source_bucket}{filename}\n")

print(f"Generated fp_file_list.txt ({len(fp_files)} files) and tp_file_list.txt ({len(tp_files)} files)")
