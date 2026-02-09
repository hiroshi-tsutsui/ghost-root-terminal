import json

with open('batch_results_summary_v6.json', 'r') as f:
    data = json.load(f)

danger_list = data['details']['danger']

with open('hard_negatives.txt', 'w') as f:
    for video in danger_list:
        f.write(f"{video}\n")

print(f"Extracted {len(danger_list)} video filenames to hard_negatives.txt")
