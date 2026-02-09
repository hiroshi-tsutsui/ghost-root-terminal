import argparse
import os
import json
import glob
from detector import FollowingDistanceDetector  # Import the local (injected) detector class

def run_experiment_suite(input_dir, output_dir, experiment_config_path):
    print(f"Loading experiments from {experiment_config_path}")
    with open(experiment_config_path, 'r') as f:
        experiments = json.load(f)

    # Load video list
    video_files = glob.glob(os.path.join(input_dir, "*.mp4"))
    print(f"Found {len(video_files)} videos.")

    results_summary = {}

    for exp in experiments:
        exp_id = exp["id"]
        params = exp["params"]
        print(f"--- Running Experiment: {exp_id} ---")
        print(f"Params: {params}")

        # Set environment variable for the detector to pick up
        os.environ["FOLLOWING_DISTANCE_CONFIG_JSON"] = json.dumps(params)
        
        # Re-instantiate detector to pick up new env vars (crucial!)
        detector = FollowingDistanceDetector(model_name="yolo11x.pt") # Assume model pre-loaded/downloaded

        exp_results = {
            "danger": [],
            "safe": [],
            "positive": []
        }

        # Process all videos
        for i, video_path in enumerate(video_files):
            if i % 50 == 0: print(f"Processing {i}/{len(video_files)}...")
            
            try:
                # We reuse the analyze_video method directly to avoid overhead
                result = detector.analyze_video(video_path, output_path=None, annotate=False)
                status = result["status"]
                filename = os.path.basename(video_path)
                
                if status == "danger":
                    exp_results["danger"].append(filename)
                elif status == "positive":
                    exp_results["positive"].append(filename)
                else:
                    exp_results["safe"].append(filename)
            except Exception as e:
                print(f"Error processing {video_path}: {e}")

        # Save summary for this experiment
        summary_entry = {
            "params": params,
            "counts": {
                "danger": len(exp_results["danger"]),
                "positive": len(exp_results["positive"]),
                "safe": len(exp_results["safe"])
            },
            # "details": exp_results # Too big to dump all details for 24 experiments in one file?
        }
        results_summary[exp_id] = summary_entry
        
        # Save individual experiment result to disk
        with open(os.path.join(output_dir, f"result_{exp_id}.json"), 'w') as f:
             json.dump({"summary": summary_entry, "details": exp_results}, f, indent=2)

    # Save master summary
    with open(os.path.join(output_dir, "master_experiment_summary.json"), 'w') as f:
        json.dump(results_summary, f, indent=2)
    print("All experiments complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", required=True)
    parser.add_argument("--output_dir", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    run_experiment_suite(args.input_dir, args.output_dir, args.config)
