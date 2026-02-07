import os
import json
import time
import subprocess

# Configuration
PROJECT_ID = "dot-sfty-core-analytics"
REGION = "us-central1"
SLACK_CHANNEL = "C0ACZEDHFV0"
INPUT_DATASET = "/mnt/share/input.mp4" # Following v3 template
OUTPUT_BUCKET_BASE = "gs://dot-sfty-core-analytics-data/output/"

VERSIONS = [
    ("v4", "ROI Shrink", "experiments/v4_roi_shrink.py"),
    ("v5", "Outlier Rejection", "experiments/v5_outlier_rejection.py"),
    ("v6", "Temporal Smoothing", "experiments/v6_temporal_smoothing.py"),
    ("v7", "Kalman Filter", "experiments/v7_kalman_filter.py"),
    ("v8", "BBox Smoothing", "experiments/v8_bbox_smoothing.py"),
    ("v9", "Adaptive Noise", "experiments/v9_adaptive_noise.py"),
    ("v10", "Fusion Suite", "experiments/v10_fusion_suite.py"),
]

def notify_slack(message_text):
    # This function will be replaced by the tool call in the main agent flow
    # But for this script running inside 'exec', it can't call tools directly.
    # So we will just print a marker that the agent can see and then I will manually call the tool?
    # No, I am the sub-agent. I can call tools.
    # This python script is running inside 'exec', so it can't call 'message' tool directly.
    # I should perform the logic in the agent's thought loop, not a bulk python script.
    pass

def create_job_config(version, script_path):
    job_name = f"following-distance-{version}-{int(time.time())}"
    output_path = f"{OUTPUT_BUCKET_BASE}{version}_test/"
    
    config = {
        "taskGroups": [
            {
                "taskSpec": {
                    "runnable": {
                        "container": {
                            "imageUri": f"gcr.io/{PROJECT_ID}/following-distance-v3:latest", # Reusing v3 image as base
                            "entrypoint": "python3",
                            "commands": [
                                f"dot-sfty-core-analytics/{script_path}" # Path inside container
                            ],
                            "environment": {
                                "variables": {
                                    "INPUT_VIDEO_PATH": INPUT_DATASET,
                                    "OUTPUT_BUCKET": output_path
                                }
                            }
                        }
                    },
                    "computeResource": {
                        "cpuMilli": 4000,
                        "memoryMib": 16384,
                        "bootDiskMib": 50000
                    },
                    "maxRetryCount": 1
                },
                "taskCount": 1,
                "parallelism": 1
            }
        ],
        "logsPolicy": {
            "destination": "CLOUD_LOGGING"
        }
    }
    
    filename = f"dot-sfty-core-analytics/jobs/job_following_distance_{version}.json"
    with open(filename, 'w') as f:
        json.dump(config, f, indent=2)
    
    return filename, job_name

# I will not run this script. I will use the agent loop to iterate.
