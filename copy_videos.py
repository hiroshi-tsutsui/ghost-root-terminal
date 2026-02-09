from google.cloud import storage
import os

# Set up GCS client
storage_client = storage.Client()
source_bucket_name = "media.dotsfty.com"
dest_bucket_name = "yolo-gcp"
dest_prefix = "eagle/infer/input/labeled/seino_following_distance_true/"

# Read the file list
with open("cleaned_list.txt", "r") as f:
    urls = [line.strip().strip('"') for line in f if line.strip()]

print(f"Found {len(urls)} URLs to copy.")

# Count success and failures
success_count = 0
fail_count = 0

for url in urls:
    try:
        # Parse gs://media.dotsfty.com/...
        parts = url.replace("gs://", "").split("/")
        bucket_name = parts[0]
        blob_name = "/".join(parts[1:])
        filename = parts[-1]

        source_bucket = storage_client.bucket(bucket_name)
        source_blob = source_bucket.blob(blob_name)
        
        dest_bucket = storage_client.bucket(dest_bucket_name)
        dest_blob_name = f"{dest_prefix}{filename}"
        dest_blob = dest_bucket.blob(dest_blob_name)

        # Copy (rewrite)
        token, bytes_rewritten, total_bytes = dest_blob.rewrite(source_blob)
        while token is not None:
            token, bytes_rewritten, total_bytes = dest_blob.rewrite(
                source_blob, token=token
            )
        
        print(f"Copied: {filename}")
        success_count += 1
        
    except Exception as e:
        print(f"Failed to copy {url}: {e}")
        fail_count += 1

print(f"Done. Success: {success_count}, Failed: {fail_count}")
