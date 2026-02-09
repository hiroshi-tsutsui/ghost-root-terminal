# Submit FP Label Gen
gcloud batch jobs submit retraining-v1-label-gen-fp-001 \
    --location us-central1 \
    --config job_fp_label_gen.json

# Submit TP Label Gen
gcloud batch jobs submit retraining-v1-label-gen-tp-001 \
    --location us-central1 \
    --config job_tp_label_gen.json
