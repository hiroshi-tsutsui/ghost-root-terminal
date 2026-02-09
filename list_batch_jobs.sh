#!/bin/bash
REGIONS=("us-central1" "us-west1" "us-east1" "us-east4" "europe-west4" "europe-west1" "asia-northeast1" "asia-east1")
for region in "${REGIONS[@]}"; do
    echo "Checking $region..."
    gcloud batch jobs list --location $region --filter="state:RUNNING OR state:QUEUED" --format="table(name, state)" --limit 5
done
