import json
import itertools

# Base parameters from sweep_v1_exp_18
base_params = {
    "W_REAL": 1.8, "H_CAM": 2.8, "H_TARGET_REF": 0.6, "HFOV_DEG": 85,
    "EMA_ALPHA": 0.3, "EMA_ALPHA_V": 0.1,
    "DIST_WARN_M": 30.0,
    "DIST_DANGER_M": 14.0,
    "DANGER_PERSISTENCE_SEC": 1.0,
    "RECOVERY_THRESHOLD_M": 5.0,
    "LANE_BOTTOM_W": 0.4, "LANE_TOP_W": 0.1, "LANE_START_Y": 0.55,
    "LANE_OFFSET_X": 0.02,
    "WIDTH_CONTAINMENT_RATIO": 0.9,
    "FRAME_SKIP": 2
}

# New ranges to sweep
# "I like the experiment 18 though. Can we try to change danger persistance, and make the distance warn and danger a little longer? Try few different combination."

# DIST_DANGER_M > 14.0
danger_distances = [15.0, 16.0, 18.0]
# DIST_WARN_M > 30.0
warn_distances = [32.0, 35.0, 40.0]
# DANGER_PERSISTENCE_SEC (change it - try shorter and longer around 1.0)
persistences = [0.8, 1.2, 1.5]

combinations = list(itertools.product(danger_distances, warn_distances, persistences))

print(f"Generating {len(combinations)} experiments for Sweep V3 (based on exp_18)...")

configs = []
for i, (danger_d, warn_d, persist) in enumerate(combinations):
    exp_id = f"sweep_v3_exp_{i+1:02d}"
    
    # Create config based on exp_18 but with overrides
    config = base_params.copy()
    config["DIST_DANGER_M"] = danger_d
    config["DIST_WARN_M"] = warn_d
    config["DANGER_PERSISTENCE_SEC"] = persist
    
    # Write config file (for reference/logging)
    filename = f"sweep_v3_configs/{exp_id}.json"
    with open(filename, "w") as f:
        json.dump(config, f, indent=2)
        
    configs.append({
        "id": exp_id,
        "config": config
    })

# Generate the job JSONs for Cloud Batch
# We'll use the same template structure as before
job_template = {
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
                "SWEEP_CONFIG": "" # To be filled
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
              "remotePath": "yolo-gcp/owl/infer/weights/"
            },
            "mountPath": "/mnt/disks/model"
          },
          { # Output specific to experiment
            "gcs": {
              "remotePath": "" # To be filled
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

for exp in configs:
    job = job_template.copy()
    # Deep copy to avoid reference issues
    job = json.loads(json.dumps(job_template))
    
    # Inject config
    job["taskGroups"][0]["taskSpec"]["runnables"][0]["environment"]["variables"]["SWEEP_CONFIG"] = json.dumps(exp["config"])
    
    # Set output path
    remote_output = f"yolo-gcp/eagle/infer/output/sweep_v3/{exp['id']}/"
    job["taskGroups"][0]["taskSpec"]["volumes"][3]["gcs"]["remotePath"] = remote_output
    
    # Save job file
    job_filename = f"job_{exp['id']}.json"
    with open(job_filename, "w") as f:
        json.dump(job, f, indent=2)

print("Job files generated.")
