#!/bin/bash
echo "Waiting for sweep-v3-exp-02 to be deleted..."
while gcloud batch jobs describe sweep-v3-exp-02 --location us-central1 >/dev/null 2>&1; do
  echo -n "."
  sleep 5
done
echo "Deleted."
