import json
import os

# Base template for the job
base_job = {
  "taskGroups": [
    {
      "taskSpec": {
        "runnables": [
          {
            "container": {
              "imageUri": "us-central1-docker.pkg.dev/dev-dotsfty/yolo/yolo:latest",
              "entrypoint": "bash",
              "commands": [
                "-c",
                "python3.11 /mnt/disks/scripts/detector_sweep_wrapper.py"
              ],
              "volumes": [
                "/mnt/disks/input:/mnt/disks/input:ro",
                "/mnt/disks/output:/mnt/disks/output:rw",
                "/mnt/disks/scripts:/mnt/disks/scripts:ro",
                "/mnt/disks/model:/mnt/disks/model:ro"
              ]
            },
            "environment": {
              "variables": {
                "SWEEP_CONFIG": "" 
              }
            }
          }
        ],
        "computeResource": {
          "cpuMilli": "4000",
          "memoryMib": "16000"
        },
        "maxRunDuration": "3600s",
        "volumes": [
          {
            "gcs": {
              "remotePath": "yolo-gcp/eagle/infer/input/labeled/following_distance_fp_Jan19_Feb5/" 
              # NOTE: Ideally we want BOTH FP and TP here. 
              # For V4, I'll stick to FP for now to keep comparison consistent with V3, 
              # but I will recommend a separate TP run or a merged bucket for V5.
            },
            "mountPath": "/mnt/disks/input"
          },
          {
            "gcs": {
              "remotePath": "yolo-gcp/scripts/"
            },
            "mountPath": "/mnt/disks/scripts"
          },
          {
            "gcs": {
              "remotePath": "dot-sfty-private/models/yolo/eagle/"
            },
            "mountPath": "/mnt/disks/model"
          },
          {
            "gcs": {
              "remotePath": "" # Filled dynamically
            },
            "mountPath": "/mnt/disks/output"
          }
        ]
      },
      "taskCount": 1,
      "parallelism": 1
    }
  ],
  "allocationPolicy": {
    "instances": [
      {
        "policy": {
          "machineType": "n1-standard-4",
          "accelerators": [
            {
              "type": "nvidia-tesla-t4",
              "count": 1
            }
          ],
          "bootDisk": {
            "type": "pd-balanced",
            "sizeGb": 100
          }
        },
        "installGpuDrivers": True
      }
    ]
  },
  "logsPolicy": {
    "destination": "CLOUD_LOGGING"
  }
}

# Parameter Ranges for V4
# Focus: Fine-tune around 15.0m and 1.5s
distances = [12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0]
persistences = [1.2, 1.5, 1.8]
emas = [0.3] # Lock EMA for now
warn_buffer = 15.0 # Keep warn ~15m above danger? Or fixed? V3 winner had 32m (17m gap).
# Let's keep Warn dynamic: Danger + 17m to match V3 winner ratio, or just fixed steps.
# Actually, V3 winner was 32m Warn for 15m Danger. Let's fix Warn at 32.0 for consistency, or vary it.
# Simpler: Vary Distance, Keep Warn/Persist relationships logic if needed.
# For V4, let's fix Warn at 35.0 (safe middle ground) to isolate Danger Distance effect.

experiments = []
exp_id = 1

for dist in distances:
    for persist in persistences:
        config = {
            "W_REAL": 1.8,
            "H_CAM": 2.8,
            "H_TARGET_REF": 0.6,
            "HFOV_DEG": 85,
            "EMA_ALPHA": 0.3,
            "EMA_ALPHA_V": 0.1,
            "DIST_WARN_M": 35.0, # Fixed for this sweep
            "DIST_DANGER_M": dist,
            "DANGER_PERSISTENCE_SEC": persist,
            "RECOVERY_THRESHOLD_M": 5.0,
            "LANE_BOTTOM_W": 0.4,
            "LANE_TOP_W": 0.1,
            "LANE_START_Y": 0.55,
            "LANE_OFFSET_X": 0.02,
            "WIDTH_CONTAINMENT_RATIO": 0.9,
            "FRAME_SKIP": 2
        }
        
        job_name = f"sweep-v4-exp-{exp_id:02d}"
        job_file = f"job_sweep_v4_exp_{exp_id:02d}.json"
        
        # Clone base
        job = json.loads(json.dumps(base_job))
        
        # Inject Config
        job['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']['SWEEP_CONFIG'] = json.dumps(config)
        
        # Inject Output Path
        job['taskGroups'][0]['taskSpec']['volumes'][3]['gcs']['remotePath'] = f"yolo-gcp/eagle/infer/output/sweep_v4/{job_name}/"
        
        # Write to file
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
            
        experiments.append(job_file)
        print(f"Generated {job_file}: Dist={dist}, Persist={persist}")
        exp_id += 1

# Generate Submission Script
with open("submit_sweep_v4.sh", "w") as f:
    f.write("#!/bin/bash\n")
    for job_file in experiments:
        f.write(f"gcloud batch jobs submit {job_file.replace('job_', '').replace('.json', '')} --location us-central1 --config {job_file}\n")
        f.write("sleep 2\n") # Rate limit buffer

print(f"Generated {len(experiments)} experiments.")
