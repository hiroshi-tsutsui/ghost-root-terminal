#!/bin/bash
# Submit all Sweep V3 jobs
for job_file in job_sweep_v3_exp_*.json; do
  JOB_ID=$(basename "$job_file" .json)
  
  # Extract exp ID for job name
  EXP_NAME=$(echo "$JOB_ID" | sed 's/job_//' | tr '_' '-')
  
  echo "Submitting $EXP_NAME..."
  
  gcloud batch jobs submit "$EXP_NAME" \
    --location us-central1 \
    --config "$job_file" || echo "Failed to submit $EXP_NAME (maybe exists?)"
  
  echo "Submitted $EXP_NAME."
  sleep 2 
done

echo "All Sweep V3 jobs submitted."
