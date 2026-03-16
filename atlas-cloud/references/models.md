# Atlas Cloud — Model Reference

## IMPORTANT: Always Fetch Real Model IDs

Model IDs are updated frequently. **Never guess or hardcode model IDs without verification.** Always fetch the latest list first:

```
GET https://api.atlascloud.ai/api/v1/models
```

This endpoint requires no authentication. The response contains all available models with their exact `model` ID, `type`, `displayName`, `price`, and `schema` URL.

**Important:** Only models with `display_console: true` are publicly available. Always filter out models where `display_console` is `false` — those are internal and not accessible to regular users.

When building integrations, either:
1. Fetch the model list at runtime and filter by `display_console: true` to get valid IDs, or
2. Verify the model ID against the API before hardcoding it

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
