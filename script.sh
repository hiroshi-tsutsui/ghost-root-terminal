#!/bin/bash
set -e  # Exit on error

# このスクリプトがあるディレクトリ（following_distance）の絶対パスを取得
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# 親ディレクトリ（scripts）のパスを取得
PARENT_DIR=$(dirname "$SCRIPT_DIR")

echo "=========================================="
echo " STARTING PIPELINE: Following Distance"
echo "=========================================="

echo ">> STEP 1: Building Image..."
# Use absolute path to build_image.sh
bash "$PARENT_DIR/build_image.sh" || { echo "Build failed"; exit 1; }

echo ">> STEP 2: Pushing Image..."
bash "$PARENT_DIR/push_image.sh" || { echo "Push failed"; exit 1; }

echo ">> STEP 3: Submitting Batch Job..."
# Use absolute path to submit script
bash "$SCRIPT_DIR/submit_following_distance_infer.sh" || { echo "Submit failed"; exit 1; }
