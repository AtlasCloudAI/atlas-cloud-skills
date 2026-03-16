# Upload Media — Complete Code Templates

Upload local image/media files to Atlas Cloud to get a publicly accessible URL. Use this when you need to provide an `image_url` to image-editing or image-to-video models but only have a local file.

> **WARNING**: This upload endpoint is strictly for temporary use with Atlas Cloud generation tasks only. Do NOT use it as permanent file hosting, CDN, or for any purpose unrelated to Atlas Cloud image/video generation. Abuse (e.g., bulk uploads, hosting illegal or unrelated content) may result in immediate API key suspension.

## Table of Contents
- [Python](#python)
- [Node.js / TypeScript](#nodejs--typescript)
- [cURL](#curl)
- [Workflow: Local File → Image-to-Video](#workflow-local-file--image-to-video)

---

## Python

```python
import requests
import os

ATLAS_API_KEY = os.environ.get("ATLASCLOUD_API_KEY")
BASE_URL = "https://api.atlascloud.ai/api/v1"


def upload_media(file_path: str) -> dict:
    """
    Upload a local file to Atlas Cloud and get a public URL.

    Args:
        file_path: Absolute path to the local file

    Returns:
        dict with download_url, filename, and size
    """
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        resp = requests.post(
            f"{BASE_URL}/model/uploadMedia",
            headers={"Authorization": f"Bearer {ATLAS_API_KEY}"},
            files=files,
            timeout=60,
        )
    resp.raise_for_status()
    data = resp.json()["data"]
    print(f"Uploaded: {data['download_url']}")
    print(f"Filename: {data['filename']}, Size: {data['size']} bytes")
    return data


# Usage
if __name__ == "__main__":
    result = upload_media("/path/to/local/photo.jpg")
    print(f"Public URL: {result['download_url']}")
```

---

## Node.js / TypeScript

```typescript
import { readFile } from 'fs/promises';
import { basename } from 'path';

const ATLAS_API_KEY = process.env.ATLASCLOUD_API_KEY;
const BASE_URL = 'https://api.atlascloud.ai/api/v1';

interface UploadResult {
  download_url: string;
  filename: string;
  size: number;
}

async function uploadMedia(filePath: string): Promise<UploadResult> {
  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);

  const resp = await fetch(`${BASE_URL}/model/uploadMedia`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ATLAS_API_KEY}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.status} ${await resp.text()}`);
  }

  const data: UploadResult = (await resp.json()).data;
  console.log(`Uploaded: ${data.download_url}`);
  console.log(`Filename: ${data.filename}, Size: ${data.size} bytes`);
  return data;
}

// Usage
const result = await uploadMedia('/path/to/local/photo.jpg');
console.log(`Public URL: ${result.download_url}`);
```

---

## cURL

```bash
# Upload a local file
RESULT=$(curl -s -X POST "https://api.atlascloud.ai/api/v1/model/uploadMedia" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -F "file=@/path/to/local/photo.jpg")

echo "Download URL:"
echo "$RESULT" | jq -r '.data.download_url'

echo "Filename:"
echo "$RESULT" | jq -r '.data.filename'

echo "Size:"
echo "$RESULT" | jq -r '.data.size'
```

---

## Workflow: Local File → Image-to-Video

### Python

```python
import requests
import time
import os

ATLAS_API_KEY = os.environ.get("ATLASCLOUD_API_KEY")
BASE_URL = "https://api.atlascloud.ai/api/v1"
HEADERS = {
    "Authorization": f"Bearer {ATLAS_API_KEY}",
    "Content-Type": "application/json",
}


def upload_media(file_path: str) -> str:
    """Upload a local file and return the public URL."""
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        resp = requests.post(
            f"{BASE_URL}/model/uploadMedia",
            headers={"Authorization": f"Bearer {ATLAS_API_KEY}"},
            files=files,
            timeout=60,
        )
    resp.raise_for_status()
    return resp.json()["data"]["download_url"]


def generate_video(model: str, prompt: str, **kwargs) -> str:
    """Submit a video generation task and poll for result."""
    payload = {"model": model, "prompt": prompt, **kwargs}
    resp = requests.post(f"{BASE_URL}/model/generateVideo", json=payload, headers=HEADERS, timeout=50)
    resp.raise_for_status()
    prediction_id = resp.json()["data"]["id"]
    print(f"Video generation submitted. Prediction ID: {prediction_id}")

    for _ in range(200):
        time.sleep(3)
        result = requests.get(f"{BASE_URL}/model/prediction/{prediction_id}", headers=HEADERS, timeout=30)
        result.raise_for_status()
        result_data = result.json()["data"]
        status = result_data.get("status", "unknown")
        if status in ("completed", "succeeded"):
            outputs = result_data.get("outputs") or result_data.get("output", [])
            if isinstance(outputs, str):
                outputs = [outputs]
            return outputs[0]
        elif status == "failed":
            raise RuntimeError(f"Generation failed: {result_data.get('error')}")
        print(f"Status: {status}...")

    raise TimeoutError("Generation timed out")


# Complete workflow: local image → upload → image-to-video
if __name__ == "__main__":
    # Step 1: Upload local image
    image_url = upload_media("/path/to/local/photo.jpg")
    print(f"Uploaded image URL: {image_url}")

    # Step 2: Generate video from the uploaded image
    video_url = generate_video(
        model="kwaivgi/kling-v3.0-std/image-to-video",
        prompt="Camera slowly zooms in, cinematic lighting",
        image_url=image_url,
        duration=5,
        aspect_ratio="16:9",
    )
    print(f"Video URL: {video_url}")
```

### cURL

```bash
# Step 1: Upload local image
IMAGE_URL=$(curl -s -X POST "https://api.atlascloud.ai/api/v1/model/uploadMedia" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -F "file=@/path/to/local/photo.jpg" | jq -r '.data.download_url')

echo "Uploaded image URL: $IMAGE_URL"

# Step 2: Generate video from uploaded image
PREDICTION_ID=$(curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateVideo" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"kwaivgi/kling-v3.0-std/image-to-video\",
    \"prompt\": \"Camera slowly zooms in, cinematic lighting\",
    \"image_url\": \"$IMAGE_URL\",
    \"duration\": 5,
    \"aspect_ratio\": \"16:9\"
  }" | jq -r '.data.id')

echo "Prediction ID: $PREDICTION_ID"

# Step 3: Poll for result
while true; do
  sleep 3
  RESULT=$(curl -s "https://api.atlascloud.ai/api/v1/model/prediction/$PREDICTION_ID" \
    -H "Authorization: Bearer $ATLASCLOUD_API_KEY")

  STATUS=$(echo "$RESULT" | jq -r '.data.status')

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "succeeded" ]; then
    echo "Video URL:"
    echo "$RESULT" | jq -r '.data.outputs[0]'
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Failed:"
    echo "$RESULT" | jq -r '.data.error'
    break
  else
    echo "Status: $STATUS..."
  fi
done
```
