# Atlas Cloud — Model Reference

## CRITICAL: Fetch From the API — Do Not Fabricate

> The tables in this file are a **snapshot, not a source of truth**. Model IDs, prices, parameter names, defaults, and enums all change. Any ID, parameter, or schema detail in code or user-facing output MUST come from a live API fetch performed in the current session.

**Mandatory workflow — no exceptions:**

1. **Always fetch the model list first.** No authentication required:
   ```
   GET https://api.atlascloud.ai/api/v1/models
   ```
   If the MCP server is installed, call `atlas_list_models` or `atlas_search_docs` instead — same live data.

2. **Filter to `display_console: true`.** Any model with `display_console: false` is internal and will fail for regular users. Do not surface those IDs.

3. **Before writing a request body, fetch the schema.** Never guess parameter names, enums, defaults, or required fields. For any target model:
   - MCP: `atlas_get_model_info` with the exact model ID
   - HTTP: GET the `schema` URL from the model entry (OpenAPI JSON) and read `components.schemas.Input.properties`

   Build the payload strictly from the fields listed there. If a parameter you want isn't in the schema, it doesn't exist on that model.

4. **Hardcoded IDs are only acceptable after verification.** Either fetch and filter at runtime, or confirm the ID against a live `GET /models` response in the same session before embedding it.

**Red flags — stop and fetch if you catch yourself doing any of these:**
- Copying a model ID from memory or from these tables without a same-session API check
- Guessing a parameter name (e.g. assuming `aspect_ratio` when the model uses `ratio`, or `image_url` when it uses `image`)
- Sending a parameter not listed in the schema
- Reporting a price to the user that wasn't in the live API response

---

## Image Models (priced per image)

| Model ID | Name | Price |
|----------|------|-------|
| `google/nano-banana-2/text-to-image` | Nano Banana 2 Text-to-Image | $0.072/image |
| `google/nano-banana-2/text-to-image-developer` | Nano Banana 2 Developer | $0.056/image |
| `google/nano-banana-2/edit` | Nano Banana 2 Edit | $0.072/image |
| `google/nano-banana-2/edit-developer` | Nano Banana 2 Edit Developer | $0.056/image |
| `bytedance/seedream-v5.0-lite` | Seedream v5.0 Lite | $0.032/image |
| `bytedance/seedream-v5.0-lite/edit` | Seedream v5.0 Lite Edit | $0.032/image |
| `bytedance/seedream-v5.0-lite/sequential` | Seedream v5.0 Lite Sequential | $0.032/image |
| `alibaba/qwen-image/edit-plus-20251215` | Qwen-Image Edit Plus | $0.021/image |
| `alibaba/wan-2.6/image-edit` | Wan-2.6 Image Edit | $0.021/image |
| `z-image/turbo` | Z-Image Turbo | $0.01/image |
| `bytedance/seedream-v4.5` | Seedream v4.5 | $0.036/image |

## Video Models (priced per generation)

| Model ID | Name | Price |
|----------|------|-------|
| `bytedance/seedance-2.0/text-to-video` | **Seedance 2.0 Text-to-Video** (native audio, 4-15s, up to 1080p) | $0.127/gen |
| `bytedance/seedance-2.0/image-to-video` | **Seedance 2.0 Image-to-Video** (first+last frame, native audio) | $0.127/gen |
| `bytedance/seedance-2.0/reference-to-video` | **Seedance 2.0 Reference-to-Video** (multimodal: up to 9 images + 3 videos + 1 audio) | $0.127/gen |
| `bytedance/seedance-2.0-fast/text-to-video` | Seedance 2.0 Fast Text-to-Video | $0.101/gen |
| `bytedance/seedance-2.0-fast/image-to-video` | Seedance 2.0 Fast Image-to-Video | $0.101/gen |
| `bytedance/seedance-2.0-fast/reference-to-video` | Seedance 2.0 Fast Reference-to-Video | $0.101/gen |
| `kwaivgi/kling-v3.0-std/text-to-video` | Kling v3.0 Std Text-to-Video | $0.153/gen |
| `kwaivgi/kling-v3.0-std/image-to-video` | Kling v3.0 Std Image-to-Video | $0.153/gen |
| `kwaivgi/kling-v3.0-pro/text-to-video` | Kling v3.0 Pro Text-to-Video | $0.204/gen |
| `kwaivgi/kling-v3.0-pro/image-to-video` | Kling v3.0 Pro Image-to-Video | $0.204/gen |
| `vidu/q3/text-to-video` | Vidu Q3 Text-to-Video | $0.06/gen |
| `vidu/q3/image-to-video` | Vidu Q3 Image-to-Video | $0.06/gen |
| `bytedance/seedance-v1.5-pro/text-to-video` | Seedance v1.5 Pro Text-to-Video | $0.222/gen |
| `bytedance/seedance-v1.5-pro/image-to-video` | Seedance v1.5 Pro Image-to-Video | $0.222/gen |
| `bytedance/seedance-v1.5-pro/image-to-video-fast` | Seedance v1.5 Pro I2V Fast | $0.018/gen |
| `alibaba/wan-2.6/image-to-video-flash` | Wan-2.6 Image-to-Video Flash | $0.018/gen |
| `alibaba/wan-2.6/image-to-video` | Wan-2.6 Image-to-Video | $0.07/gen |
| `kwaivgi/kling-v2.6-pro/avatar` | Kling v2.6 Pro Avatar | $0.095/gen |
| `kwaivgi/kling-v2.6-std/avatar` | Kling v2.6 Std Avatar | $0.048/gen |

## LLM Models (priced per million tokens)

| Model ID | Name | Input | Output |
|----------|------|-------|--------|
| `qwen/qwen3.5-397b-a17b` | Qwen3.5 397B A17B | $0.55/M | $3.5/M |
| `qwen/qwen3.5-122b-a10b` | Qwen3.5 122B A10B | $0.3/M | $2.4/M |
| `qwen/qwen3.5-35b-a3b` | Qwen3.5 35B A3B | $0.225/M | $1.8/M |
| `qwen/qwen3.5-27b` | Qwen3.5 27B | $0.27/M | $2.16/M |
| `qwen/qwen3-coder-next` | Qwen3 Coder Next | $0.18/M | $1.35/M |
| `moonshotai/kimi-k2.5` | Kimi K2.5 | $0.5/M | $2.6/M |
| `zai-org/glm-5` | GLM 5 | $0.95/M | $3.15/M |
| `minimaxai/minimax-m2.5` | MiniMax M2.5 | $0.295/M | $1.2/M |
| `deepseek-ai/deepseek-v3.2-speciale` | DeepSeek V3.2 Speciale | $0.4/M | $1.2/M |
| `qwen/qwen3-max-2026-01-23` | Qwen3 Max | $1.2/M | $6/M |
| `zai-org/glm-4.7` | GLM 4.7 | $0.52/M | $1.75/M |
| `minimaxai/minimax-m2.1` | MiniMax M2.1 | $0.29/M | $0.95/M |

## Model Type → Endpoint Mapping

| Type | Endpoint |
|------|----------|
| `"Image"` | `POST https://api.atlascloud.ai/api/v1/model/generateImage` |
| `"Video"` | `POST https://api.atlascloud.ai/api/v1/model/generateVideo` |
| `"Text"` | `POST https://api.atlascloud.ai/v1/chat/completions` |

## Price Structure

The price field in the API response has this structure:

- **Image/Video models**: Use `price.actual.base_price` — this is the cost per generation
- **LLM models**: Use `price.actual.input_price` and `price.actual.output_price` — cost per million tokens
- Fallback chain: `price.actual` → `price.sku.text` → top-level `inputPrice`/`basePrice`
- `price.discount`: Discount percentage (e.g., "70" means 70% of original price)

## Model Schema

Each model has a `schema` field pointing to an OpenAPI JSON file that describes all available parameters. Fetch it to understand what a specific model accepts:

```python
import requests

# Get public model list
models = requests.get("https://api.atlascloud.ai/api/v1/models").json()["data"]
public_models = [m for m in models if m.get("display_console") == True]

# Find a specific model
model = next(m for m in public_models if m["model"] == "bytedance/seedream-v5.0-lite")

# Fetch its parameter schema
if model.get("schema"):
    schema = requests.get(model["schema"]).json()
    # schema["components"]["schemas"]["Input"]["properties"] contains all parameters
```
