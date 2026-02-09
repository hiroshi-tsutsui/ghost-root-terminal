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

# Parameter Ranges for V4.1 (High Range)
distances = [18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0]
persistences = [1.2, 1.5, 1.8]

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
            "DIST_WARN_M": 35.0, # Fixed
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
        
        job_name = f"sweep-v4-1-exp-{exp_id:02d}"
        job_file = f"job_sweep_v4_1_exp_{exp_id:02d}.json"
        
        # Clone base
        job = json.loads(json.dumps(base_job))
        
        # Inject Config
        job['taskGroups'][0]['taskSpec']['runnables'][0]['environment']['variables']['SWEEP_CONFIG'] = json.dumps(config)
        
        # Inject Output Path
        job['taskGroups'][0]['taskSpec']['volumes'][3]['gcs']['remotePath'] = f"yolo-gcp/eagle/infer/output/sweep_v4_1/{job_name}/"
        
        # Write to file
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
            
        experiments.append(job_file)
        print(f"Generated {job_file}: Dist={dist}, Persist={persist}")
        exp_id += 1

# Generate Submission Script
with open("submit_sweep_v4_1.sh", "w") as f:
    f.write("#!/bin/bash\n")
    for job_file in experiments:
        job_name = job_file.replace('job_', '').replace('.json', '').replace('_', '-')
        f.write(f"gcloud batch jobs submit {job_name} --location us-central1 --config {job_file}\n")
        f.write("sleep 2\n") 

print(f"Generated {len(experiments)} experiments.")
