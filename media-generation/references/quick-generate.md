# Quick Generate — Complete Code Templates

One-step generation that automatically searches for a model by keyword, fetches its schema, builds parameters, and submits the task. No need to know exact model IDs.

## Table of Contents
- [Python](#python)
- [Node.js / TypeScript](#nodejs--typescript)

---

## Python

```python
import requests
import time
import os
import re

ATLAS_API_KEY = os.environ.get("ATLASCLOUD_API_KEY")
BASE_URL = "https://api.atlascloud.ai/api/v1"
MODELS_URL = "https://api.atlascloud.ai/api/v1/models"

HEADERS = {
    "Authorization": f"Bearer {ATLAS_API_KEY}",
    "Content-Type": "application/json",
}


def search_models(keyword: str, model_type: str = None) -> list:
    """
    Search models by keyword with fuzzy matching.

    Args:
        keyword: Search keyword (e.g. "seedream", "kling v3", "nano banana")
        model_type: Filter by type: "Image", "Video", or "Text"

    Returns:
        List of matching model dicts
    """
    resp = requests.get(MODELS_URL, timeout=30)
    resp.raise_for_status()
    models = resp.json()["data"]

    # Filter public models only
    models = [m for m in models if m.get("display_console") == True]

    if model_type:
        models = [m for m in models if m.get("type") == model_type]

    # Normalize keyword for fuzzy matching
    keyword_normalized = re.sub(r"[-_/\s.]+", "", keyword.lower())

    results = []
    for m in models:
        searchable = f"{m.get('model', '')} {m.get('displayName', '')} {' '.join(m.get('tags', []))}".lower()
        searchable_normalized = re.sub(r"[-_/\s.]+", "", searchable)

        if keyword_normalized in searchable_normalized:
            results.append(m)

    return results


def get_model_schema(model: dict) -> dict | None:
    """Fetch the OpenAPI schema for a model."""
    schema_url = model.get("schema")
    if not schema_url:
        return None
    try:
        resp = requests.get(schema_url, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def build_params(
    schema: dict | None,
    model_id: str,
    prompt: str,
    image_url: str = None,
    extra_params: dict = None,
) -> dict:
    """Build request params from schema, auto-filling prompt and image_url fields."""
    params = {"model": model_id}

    if schema:
        input_schema = schema.get("components", {}).get("schemas", {}).get("Input", {})
        properties = input_schema.get("properties", {})
        required = input_schema.get("required", [])

        # Find and set prompt field
        prompt_field = None
        for key in properties:
            if key in ("prompt", "text", "text_prompt"):
                prompt_field = key
                break
            desc = properties[key].get("description", "").lower()
            if "prompt" in desc:
                prompt_field = key
                break
        if prompt_field:
            params[prompt_field] = prompt

        # Find and set image URL field
        if image_url:
            image_field = None
            for key in properties:
                if key in ("image_url", "image", "input_image", "init_image", "source_image"):
                    image_field = key
                    break
                desc = properties[key].get("description", "").lower()
                if "image url" in desc or "input image" in desc:
                    image_field = key
                    break
            if image_field:
                params[image_field] = image_url

        # Fill required fields with defaults
        for key in required:
            if key not in params:
                prop = properties.get(key, {})
                if prop.get("default") is not None:
                    params[key] = prop["default"]
    else:
        params["prompt"] = prompt
        if image_url:
            params["image_url"] = image_url

    # Apply user overrides
    if extra_params:
        params.update(extra_params)

    return params


def quick_generate(
    model_keyword: str,
    gen_type: str,
    prompt: str,
    image_url: str = None,
    extra_params: dict = None,
) -> str:
    """
    One-step generation: search model → fetch schema → build params → submit.

    Args:
        model_keyword: Keyword to search for the model (e.g. "seedream v5", "kling v3")
        gen_type: "Image" or "Video"
        prompt: Text description of what to generate
        image_url: Optional source image URL for image-to-video or image editing
        extra_params: Optional dict of additional model parameters

    Returns:
        Prediction ID to check result with
    """
    # Step 1: Search for model
    matches = search_models(model_keyword, gen_type)
    if not matches:
        raise ValueError(f"No {gen_type} model found for '{model_keyword}'. Check available models first.")

    model = matches[0]
    model_id = model["model"]
    print(f"Using model: {model.get('displayName', model_id)} ({model_id})")

    if len(matches) > 1:
        others = [m.get("displayName", m["model"]) for m in matches[1:5]]
        print(f"Other candidates: {', '.join(others)}")

    # Step 2: Fetch schema
    schema = get_model_schema(model)

    # Step 3: Build params
    params = build_params(schema, model_id, prompt, image_url, extra_params)

    # Step 4: Submit generation
    endpoint = "generateImage" if gen_type == "Image" else "generateVideo"
    resp = requests.post(f"{BASE_URL}/model/{endpoint}", json=params, headers=HEADERS, timeout=50)
    resp.raise_for_status()

    prediction_id = resp.json()["data"]["id"]
    wait_time = "10-30 seconds" if gen_type == "Image" else "1-5 minutes"
    print(f"Generation submitted! Prediction ID: {prediction_id}")
    print(f"Expected wait time: {wait_time}")

    return prediction_id


def poll_result(prediction_id: str) -> str:
    """Poll for generation result and return the output URL."""
    for _ in range(200):
        time.sleep(3)
        result = requests.get(f"{BASE_URL}/model/prediction/{prediction_id}", headers=HEADERS, timeout=30)
        result.raise_for_status()
        data = result.json()["data"]
        status = data.get("status", "unknown")

        if status in ("completed", "succeeded"):
            outputs = data.get("outputs") or data.get("output", [])
            if isinstance(outputs, str):
                outputs = [outputs]
            return outputs[0]
        elif status == "failed":
            raise RuntimeError(f"Generation failed: {data.get('error')}")
        print(f"Status: {status}...")

    raise TimeoutError("Generation timed out")


# Usage examples
if __name__ == "__main__":
    # Example 1: Quick image generation
    pred_id = quick_generate(
        model_keyword="seedream v5",
        gen_type="Image",
        prompt="A serene Japanese garden with cherry blossoms",
        extra_params={"image_size": "1024x1024"},
    )
    url = poll_result(pred_id)
    print(f"Image URL: {url}")

    # Example 2: Quick video generation
    pred_id = quick_generate(
        model_keyword="kling v3",
        gen_type="Video",
        prompt="A rocket launching into space with dramatic clouds",
        extra_params={"duration": 5, "aspect_ratio": "16:9"},
    )
    url = poll_result(pred_id)
    print(f"Video URL: {url}")

    # Example 3: Image-to-video with local file upload
    # First upload local image
    with open("/path/to/photo.jpg", "rb") as f:
        files = {"file": (os.path.basename("/path/to/photo.jpg"), f)}
        upload_resp = requests.post(
            f"{BASE_URL}/model/uploadMedia",
            headers={"Authorization": f"Bearer {ATLAS_API_KEY}"},
            files=files,
            timeout=60,
        )
    image_url = upload_resp.json()["data"]["download_url"]

    # Then quick generate video from uploaded image
    pred_id = quick_generate(
        model_keyword="kling v3 image",
        gen_type="Video",
        prompt="Camera slowly pans right with cinematic lighting",
        image_url=image_url,
        extra_params={"duration": 5},
    )
    url = poll_result(pred_id)
    print(f"Video URL: {url}")
```

---

## Node.js / TypeScript

```typescript
const ATLAS_API_KEY = process.env.ATLASCLOUD_API_KEY;
const BASE_URL = 'https://api.atlascloud.ai/api/v1';
const MODELS_URL = 'https://api.atlascloud.ai/api/v1/models';

const headers = {
  Authorization: `Bearer ${ATLAS_API_KEY}`,
  'Content-Type': 'application/json',
};

interface Model {
  model: string;
  displayName?: string;
  type: string;
  tags?: string[];
  schema?: string;
  display_console?: boolean;
}

async function searchModels(keyword: string, type?: string): Promise<Model[]> {
  const resp = await fetch(MODELS_URL);
  if (!resp.ok) throw new Error(`Failed to fetch models: ${resp.status}`);
  const models: Model[] = (await resp.json()).data;

  // Filter public models
  let filtered = models.filter((m) => m.display_console === true);
  if (type) filtered = filtered.filter((m) => m.type === type);

  // Fuzzy match
  const normalized = keyword.toLowerCase().replace(/[-_/\s.]+/g, '');
  return filtered.filter((m) => {
    const searchable = `${m.model} ${m.displayName || ''} ${(m.tags || []).join(' ')}`
      .toLowerCase()
      .replace(/[-_/\s.]+/g, '');
    return searchable.includes(normalized);
  });
}

async function getModelSchema(model: Model): Promise<Record<string, any> | null> {
  if (!model.schema) return null;
  try {
    const resp = await fetch(model.schema);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function buildParams(
  schema: Record<string, any> | null,
  modelId: string,
  prompt: string,
  imageUrl?: string,
  extraParams?: Record<string, unknown>
): Record<string, unknown> {
  const params: Record<string, unknown> = { model: modelId };

  if (schema) {
    const inputSchema = schema.components?.schemas?.Input || {};
    const properties = inputSchema.properties || {};
    const required: string[] = inputSchema.required || [];

    // Find prompt field
    const promptField = Object.keys(properties).find(
      (k) =>
        ['prompt', 'text', 'text_prompt'].includes(k) ||
        properties[k]?.description?.toLowerCase().includes('prompt')
    );
    if (promptField) params[promptField] = prompt;

    // Find image URL field
    if (imageUrl) {
      const imageField = Object.keys(properties).find(
        (k) =>
          ['image_url', 'image', 'input_image', 'init_image', 'source_image'].includes(k) ||
          properties[k]?.description?.toLowerCase().includes('image url') ||
          properties[k]?.description?.toLowerCase().includes('input image')
      );
      if (imageField) params[imageField] = imageUrl;
    }

    // Fill required defaults
    for (const key of required) {
      if (params[key] === undefined && properties[key]?.default !== undefined) {
        params[key] = properties[key].default;
      }
    }
  } else {
    params.prompt = prompt;
    if (imageUrl) params.image_url = imageUrl;
  }

  if (extraParams) Object.assign(params, extraParams);
  return params;
}

async function quickGenerate(options: {
  modelKeyword: string;
  type: 'Image' | 'Video';
  prompt: string;
  imageUrl?: string;
  extraParams?: Record<string, unknown>;
}): Promise<string> {
  const { modelKeyword, type, prompt, imageUrl, extraParams } = options;

  // Step 1: Search for model
  const matches = await searchModels(modelKeyword, type);
  if (matches.length === 0) {
    throw new Error(`No ${type} model found for "${modelKeyword}". Check available models first.`);
  }

  const model = matches[0];
  console.log(`Using model: ${model.displayName || model.model} (${model.model})`);

  if (matches.length > 1) {
    const others = matches.slice(1, 5).map((m) => m.displayName || m.model);
    console.log(`Other candidates: ${others.join(', ')}`);
  }

  // Step 2: Fetch schema
  const schema = await getModelSchema(model);

  // Step 3: Build params
  const requestBody = buildParams(schema, model.model, prompt, imageUrl, extraParams);

  // Step 4: Submit generation
  const endpoint = type === 'Image' ? 'generateImage' : 'generateVideo';
  const resp = await fetch(`${BASE_URL}/model/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    throw new Error(`Generation failed: ${resp.status} ${await resp.text()}`);
  }

  const predictionId = (await resp.json()).data.id;
  const waitTime = type === 'Image' ? '10-30 seconds' : '1-5 minutes';
  console.log(`Generation submitted! Prediction ID: ${predictionId}`);
  console.log(`Expected wait time: ${waitTime}`);

  return predictionId;
}

async function pollResult(predictionId: string): Promise<string> {
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 3000));

    const resp = await fetch(`${BASE_URL}/model/prediction/${predictionId}`, { headers });
    if (!resp.ok) throw new Error(`Poll failed: ${resp.status}`);

    const data = (await resp.json()).data;

    if (data.status === 'completed' || data.status === 'succeeded') {
      const outputs = data.outputs ?? (Array.isArray(data.output) ? data.output : data.output ? [data.output] : []);
      return outputs[0];
    }

    if (data.status === 'failed') {
      throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
    }

    console.log(`Status: ${data.status}...`);
  }

  throw new Error('Generation timed out');
}

// Usage examples

// Quick image generation
const predId = await quickGenerate({
  modelKeyword: 'seedream v5',
  type: 'Image',
  prompt: 'A serene Japanese garden with cherry blossoms',
  extraParams: { image_size: '1024x1024' },
});
const imageUrl = await pollResult(predId);
console.log(`Image URL: ${imageUrl}`);

// Quick video generation
const videoPredId = await quickGenerate({
  modelKeyword: 'kling v3',
  type: 'Video',
  prompt: 'A rocket launching into space with dramatic clouds',
  extraParams: { duration: 5, aspect_ratio: '16:9' },
});
const videoUrl = await pollResult(videoPredId);
console.log(`Video URL: ${videoUrl}`);
```
