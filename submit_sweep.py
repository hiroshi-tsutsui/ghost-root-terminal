import json
import subprocess
import os
import time

# Load experiments
with open("sweep_experiments.json", "r") as f:
    experiments = json.load(f)

# Job Template
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
                "variables": {} 
            }
          }
        ],
        "computeResource": {
          "cpuMilli": "4000", # Boosted to 4 vCPU
          "memoryMib": "16000"
        },
        "maxRunDuration": "3600s",
        "volumes": [
          {
            "gcs": { "remotePath": "yolo-gcp/eagle/infer/input/labeled/following_distance_fp_Jan19_Feb5/" },
            "mountPath": "/mnt/disks/input"
          },
          {
            "gcs": { "remotePath": "yolo-gcp/scripts/" },
            "mountPath": "/mnt/disks/scripts"
          },
          {
            "gcs": { "remotePath": "dot-sfty-private/models/yolo/eagle/" },
            "mountPath": "/mnt/disks/model"
          }
          # Output volume will be specific to each job
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
          "accelerators": [ { "type": "nvidia-tesla-t4", "count": 1 } ],
          "bootDisk": { "type": "pd-balanced", "sizeGb": 100 }
        },
        "installGpuDrivers": True
      }
    ]
  },
  "logsPolicy": { "destination": "CLOUD_LOGGING" }
}

for exp in experiments:
    exp_id = exp["id"]
    params = exp["params"]
    
    # Clone base
    job = json.loads(json.dumps(base_job))
    
    # 1. Set Output Volume
    output_path = f"yolo-gcp/eagle/infer/output/sweep_v2/{exp_id}/"
    job["taskGroups"][0]["taskSpec"]["volumes"].append({
        "gcs": { "remotePath": output_path },
        "mountPath": "/mnt/disks/output"
    })
    
    # 2. Set Env Var
    job["taskGroups"][0]["taskSpec"]["runnables"][0]["environment"]["variables"]["SWEEP_CONFIG"] = json.dumps(params)
    
    # 3. Write JSON
    job_filename = f"job_v2_{exp_id}.json"
    with open(job_filename, "w") as f:
        json.dump(job, f, indent=2)
        
    # 4. Submit
    job_name = f"sweep-v2-{exp_id.replace('_','-')}"
    print(f"Submitting {job_name}...")
    try:
        cmd = [
            "gcloud", "batch", "jobs", "submit", job_name,
            "--location=us-central1",
            "--config", job_filename
        ]
        subprocess.check_call(cmd)
        print("Submitted.")
        time.sleep(1) # Rate limit protection
    except Exception as e:
        print(f"Failed to submit {job_name}: {e}")

print("Sweep submission complete.")
