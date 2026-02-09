#!/bin/bash
# Kill currently running/queued Sweep V4 jobs
for i in {01..21}; do
  JOB_ID="sweep-v4-exp-$i"
  echo "Deleting job: $JOB_ID"
  gcloud batch jobs delete $JOB_ID --location us-central1 --quiet &
done
wait
echo "All V4 jobs deletion requested."
