#!/bin/bash
set -e

# Re-Submit Single Test Job (Exp 01)
JOB_ID="sweep-v3-exp-01"

echo "Checking status of $JOB_ID..."
STATUS=$(gcloud batch jobs describe $JOB_ID --location us-central1 --format="value(status.state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$STATUS" == "RUNNING" ] || [ "$STATUS" == "QUEUED" ] || [ "$STATUS" == "SCHEDULED" ]; then
  echo "Job $JOB_ID is active ($STATUS). Cancelling..."
  gcloud batch jobs delete $JOB_ID --location us-central1 --quiet
  echo "Waiting for deletion..."
  sleep 10
fi

echo "Submitting $JOB_ID (RETRY 2)..."
gcloud batch jobs submit "$JOB_ID" \
  --location us-central1 \
  --config "job_sweep_v3_exp_01.json"

echo "Submitted $JOB_ID."
