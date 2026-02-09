#!/bin/bash
set -e

# Cancel all Sweep V3 jobs
for job_file in job_sweep_v3_exp_*.json; do
  # Extract exp ID from filename
  JOB_ID=$(basename "$job_file" .json | sed 's/job_//' | tr '_' '-')
  
  echo "Deleting $JOB_ID..."
  # Use || true to ignore errors if job doesn't exist
  gcloud batch jobs delete "$JOB_ID" --location us-central1 --quiet || true
  
  echo "Deleted $JOB_ID."
done

echo "All Sweep V3 jobs cancelled."
