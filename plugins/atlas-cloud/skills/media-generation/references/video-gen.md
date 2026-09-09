# Video Generation — Complete Code Templates

## Table of Contents
- [Python](#python)
- [Node.js / TypeScript](#nodejs--typescript)
- [cURL](#curl)

---

## Python

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


def generate_video(model: str, prompt: str, **kwargs) -> str:
    """
    Generate a video and return the output URL.

    Args:
        model: Model ID, e.g. "kwaivgi/kling-v3.0-std/text-to-video"
        prompt: Text description of the video
        **kwargs: Additional parameters (duration, aspect_ratio, image_url, etc.)

    Returns:
        URL of the generated video
    """
    # Step 1: Submit generation task
    payload = {"model": model, "prompt": prompt, **kwargs}
    resp = requests.post(f"{BASE_URL}/model/generateVideo", json=payload, headers=HEADERS, timeout=50)
    resp.raise_for_status()
    data = resp.json()

    prediction_id = data["data"]["id"]
    print(f"Task submitted. Prediction ID: {prediction_id}")

    # Step 2: Poll for result (videos take longer, up to 10 min)
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
            print(f"Generation completed: {outputs[0]}")
            return outputs[0]
        elif status == "failed":
            error = result_data.get("error", "Unknown error")
            raise RuntimeError(f"Generation failed: {error}")
        else:
            print(f"Status: {status}...")

    raise TimeoutError("Generation timed out")


# Text-to-Video
if __name__ == "__main__":
    url = generate_video(
        model="kwaivgi/kling-v3.0-std/text-to-video",
        prompt="A rocket launching into space with dramatic clouds",
        duration=5,
        aspect_ratio="16:9",
    )
    print(f"Video URL: {url}")
```

### Image-to-Video (Python)

```python
url = generate_video(
    model="kwaivgi/kling-v3.0-std/image-to-video",
    prompt="Camera slowly zooms in, petals gently falling",
    image_url="https://example.com/cherry-blossom.jpg",
    duration=5,
    aspect_ratio="16:9",
)
print(f"Video URL: {url}")
```

---

## Node.js / TypeScript

```typescript
const ATLAS_API_KEY = process.env.ATLASCLOUD_API_KEY;
const BASE_URL = 'https://api.atlascloud.ai/api/v1';

const headers = {
  Authorization: `Bearer ${ATLAS_API_KEY}`,
  'Content-Type': 'application/json',
};

async function generateVideo(
  model: string,
  prompt: string,
  extraParams: Record<string, unknown> = {}
): Promise<string> {
  // Step 1: Submit generation task
  const submitResp = await fetch(`${BASE_URL}/model/generateVideo`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, prompt, ...extraParams }),
  });

  if (!submitResp.ok) {
    throw new Error(`Submit failed: ${submitResp.status} ${await submitResp.text()}`);
  }

  const submitData = await submitResp.json();
  const predictionId = submitData.data.id;
  console.log(`Task submitted. Prediction ID: ${predictionId}`);

  // Step 2: Poll for result (videos take 1-5 minutes)
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const pollResp = await fetch(`${BASE_URL}/model/prediction/${predictionId}`, { headers });
    if (!pollResp.ok) {
      throw new Error(`Poll failed: ${pollResp.status}`);
    }

    const result = (await pollResp.json()).data;

    if (result.status === 'completed' || result.status === 'succeeded') {
      const outputs = result.outputs ?? (Array.isArray(result.output) ? result.output : result.output ? [result.output] : []);
      console.log(`Generation completed: ${outputs[0]}`);
      return outputs[0];
    }

    if (result.status === 'failed') {
      throw new Error(`Generation failed: ${result.error || 'Unknown error'}`);
    }

    console.log(`Status: ${result.status}...`);
  }

  throw new Error('Generation timed out');
}

// Text-to-Video
const videoUrl = await generateVideo(
  'kwaivgi/kling-v3.0-std/text-to-video',
  'A rocket launching into space with dramatic clouds',
  { duration: 5, aspect_ratio: '16:9' }
);

// Image-to-Video
const videoUrl2 = await generateVideo(
  'kwaivgi/kling-v3.0-std/image-to-video',
  'Camera slowly zooms in, petals gently falling',
  { image_url: 'https://example.com/cherry-blossom.jpg', duration: 5 }
);
```

---

## cURL

### Text-to-Video

```bash
PREDICTION_ID=$(curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateVideo" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kwaivgi/kling-v3.0-std/text-to-video",
    "prompt": "A rocket launching into space with dramatic clouds",
    "duration": 5,
    "aspect_ratio": "16:9"
  }' | jq -r '.data.id')

echo "Prediction ID: $PREDICTION_ID"

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

### Image-to-Video

```bash
PREDICTION_ID=$(curl -s -X POST "https://api.atlascloud.ai/api/v1/model/generateVideo" \
  -H "Authorization: Bearer $ATLASCLOUD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kwaivgi/kling-v3.0-std/image-to-video",
    "prompt": "Camera slowly zooms in, petals gently falling",
    "image_url": "https://example.com/cherry-blossom.jpg",
    "duration": 5,
    "aspect_ratio": "16:9"
  }' | jq -r '.data.id')

echo "Prediction ID: $PREDICTION_ID"
# ... same polling loop as above
```
