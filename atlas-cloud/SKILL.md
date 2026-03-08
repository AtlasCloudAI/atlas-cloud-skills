---
name: atlas-cloud
description: "Atlas Cloud API integration skill — quickly call 300+ AI image generation, video generation, and LLM models through a unified API. Use this skill when the user needs to integrate AI image generation (e.g., Flux, Seedream, DALL-E), AI video generation (e.g., Kling, Sora, Seedance), or call LLM APIs (OpenAI-compatible format) into their project. Applicable scenarios include: generating images, generating videos, calling large language models, using Atlas Cloud API, configuring ATLASCLOUD_API_KEY, querying available model lists, image-to-video, text-to-image, text-to-video, AI content creation tool integration. Even if the user doesn't explicitly mention Atlas Cloud, this skill should be considered whenever AI media generation API integration development is involved."
---

# Atlas Cloud API Integration Guide

Atlas Cloud is an AI API aggregation platform that provides access to 300+ image, video, and LLM models through a unified interface. This skill helps you quickly integrate Atlas Cloud API into any project.

## Quick Start

### 1. Get an API Key

Create an API Key at [Atlas Cloud Console](https://www.atlascloud.ai/console/api-keys).

### 2. Set Environment Variable

```bash
export ATLASCLOUD_API_KEY="your-api-key-here"
```

## API Architecture

Atlas Cloud has two main API endpoints:

| Endpoint | Base URL | Purpose |
|----------|----------|---------|
| **Media Generation API** | `https://api.atlascloud.ai/api/v1` | Image generation, video generation, poll results |
| **LLM API** | `https://api.atlascloud.ai/v1` | Chat completions (OpenAI-compatible) |

All requests require the following headers:
```
Authorization: Bearer $ATLASCLOUD_API_KEY
Content-Type: application/json
```

## Image Generation

Image generation is an asynchronous two-step process: **submit task → poll result**.

### Submit Image Generation Task

```
POST https://api.atlascloud.ai/api/v1/model/generateImage
```

Request body:
```json
{
  "model": "bytedance/seedream-v5.0-lite",
  "prompt": "A beautiful sunset over mountains",
  "image_size": "1024x1024"
}
```

Response:
```json
{
  "code": 200,
  "data": {
    "id": "prediction_abc123",
    "status": "starting"
  }
}
```

Different models accept different parameters. Common parameters include:
- `prompt` (required): Image description
- `image_size` / `width` + `height`: Dimensions
- `num_inference_steps`: Inference steps
- `guidance_scale`: Guidance scale
- `image_url`: Input image (for image-to-image models)

### Poll Generation Result

```
GET https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}
```

Response:
```json
{
  "code": 200,
  "data": {
    "id": "prediction_abc123",
    "status": "completed",
    "outputs": ["https://cdn.atlascloud.ai/generated/xxx.png"]
  }
}
```

Possible `status` values: `starting` → `processing` → `completed` / `failed`

Image generation typically takes **10-30 seconds**. Poll every **3 seconds**.

## Video Generation

Video generation follows the exact same flow as image generation, just with a different endpoint.

### Submit Video Generation Task

```
POST https://api.atlascloud.ai/api/v1/model/generateVideo
```

Request body:
```json
{
  "model": "kwaivgi/kling-v3.0-std/text-to-video",
  "prompt": "A rocket launching into space",
  "duration": 5,
  "aspect_ratio": "16:9"
}
```

Common video model parameters:
- `prompt` (required): Video description
- `image_url`: Input image (for image-to-video models)
- `duration`: Video duration in seconds
- `aspect_ratio`: Aspect ratio (e.g., `"16:9"`, `"9:16"`, `"1:1"`)

Poll results using the same prediction endpoint. Video generation typically takes **1-5 minutes**.

## LLM Chat API (OpenAI-Compatible)

The LLM API is fully compatible with the OpenAI format. You can use the OpenAI SDK directly.

```
POST https://api.atlascloud.ai/v1/chat/completions
```

Request body:
```json
{
  "model": "qwen/qwen3.5-397b-a17b",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": false
}
```

Response (standard OpenAI format):
```json
{
  "id": "chatcmpl-xxx",
  "model": "qwen/qwen3.5-397b-a17b",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "Hello! How can I help?"},
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 8,
    "total_tokens": 28
  }
}
```

### Using OpenAI SDK

Since Atlas Cloud LLM API is fully OpenAI-compatible, you can use the official SDKs directly:

**Python:**
```python
from openai import OpenAI

client = OpenAI(
    api_key="your-atlascloud-api-key",
    base_url="https://api.atlascloud.ai/v1"
)

response = client.chat.completions.create(
    model="qwen/qwen3.5-397b-a17b",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=1024
)
print(response.choices[0].message.content)
```

**Node.js / TypeScript:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-atlascloud-api-key',
  baseURL: 'https://api.atlascloud.ai/v1',
});

const response = await client.chat.completions.create({
  model: 'qwen/qwen3.5-397b-a17b',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1024,
});
console.log(response.choices[0].message.content);
```

## Code Templates

For full implementation code with polling logic, error handling, and streaming support, read the reference files:

- **`references/image-gen.md`** — Complete image generation implementation (Python / Node.js / cURL)
- **`references/video-gen.md`** — Complete video generation implementation, including image-to-video
- **`references/llm-chat.md`** — LLM chat implementation with streaming support
- **`references/models.md`** — Popular model ID quick reference

Read the corresponding reference file when you need to write specific integration code.

## IMPORTANT: Always Verify Model IDs

Model IDs change frequently as new versions are released and old ones are deprecated. **Unless you are 100% certain of an exact model ID, always fetch the real model list first** before writing any integration code:

```
GET https://console.atlascloud.ai/api/v1/models
```

This endpoint requires no authentication and returns all currently available models with their exact IDs, types, and pricing. Never guess or fabricate model IDs — an incorrect model ID will cause API calls to fail.

**Important:** Only models with `display_console: true` are publicly available. Filter out models where `display_console` is `false` — those are internal and not accessible to regular users.

When writing code for the user, always include a step to verify the model ID exists, or fetch the list programmatically to pick the right one.

## Popular Models (examples only — always verify via API)

### Image Models (priced per image)
| Model ID | Name | Price |
|----------|------|-------|
| `google/nano-banana-2/text-to-image` | Nano Banana 2 Text-to-Image | $0.072/image |
| `google/nano-banana-2/text-to-image-developer` | Nano Banana 2 Developer | $0.056/image |
| `google/nano-banana-2/edit` | Nano Banana 2 Edit | $0.072/image |
| `bytedance/seedream-v5.0-lite` | Seedream v5.0 Lite | $0.032/image |
| `bytedance/seedream-v5.0-lite/edit` | Seedream v5.0 Lite Edit | $0.032/image |
| `alibaba/qwen-image/edit-plus-20251215` | Qwen-Image Edit Plus | $0.021/image |
| `z-image/turbo` | Z-Image Turbo | $0.01/image |

### Video Models (priced per generation)
| Model ID | Name | Price |
|----------|------|-------|
| `kwaivgi/kling-v3.0-std/text-to-video` | Kling v3.0 Std Text-to-Video | $0.153/gen |
| `kwaivgi/kling-v3.0-std/image-to-video` | Kling v3.0 Std Image-to-Video | $0.153/gen |
| `kwaivgi/kling-v3.0-pro/text-to-video` | Kling v3.0 Pro Text-to-Video | $0.204/gen |
| `kwaivgi/kling-v3.0-pro/image-to-video` | Kling v3.0 Pro Image-to-Video | $0.204/gen |
| `bytedance/seedance-v1.5-pro/text-to-video` | Seedance v1.5 Pro Text-to-Video | $0.222/gen |
| `bytedance/seedance-v1.5-pro/image-to-video` | Seedance v1.5 Pro Image-to-Video | $0.222/gen |
| `vidu/q3/text-to-video` | Vidu Q3 Text-to-Video | $0.06/gen |
| `vidu/q3/image-to-video` | Vidu Q3 Image-to-Video | $0.06/gen |
| `alibaba/wan-2.6/image-to-video` | Wan-2.6 Image-to-Video | $0.07/gen |

### LLM Models (priced per million tokens)
| Model ID | Name | Input | Output |
|----------|------|-------|--------|
| `qwen/qwen3.5-397b-a17b` | Qwen3.5 397B A17B | $0.55/M | $3.5/M |
| `qwen/qwen3.5-122b-a10b` | Qwen3.5 122B A10B | $0.3/M | $2.4/M |
| `moonshotai/kimi-k2.5` | Kimi K2.5 | $0.5/M | $2.6/M |
| `zai-org/glm-5` | GLM 5 | $0.95/M | $3.15/M |
| `minimaxai/minimax-m2.5` | MiniMax M2.5 | $0.295/M | $1.2/M |
| `deepseek-ai/deepseek-v3.2-speciale` | DeepSeek V3.2 Speciale | $0.4/M | $1.2/M |
| `qwen/qwen3-coder-next` | Qwen3 Coder Next | $0.18/M | $1.35/M |

The model list is continuously updated. Get the latest full list:
```
GET https://console.atlascloud.ai/api/v1/models
```
This endpoint requires no authentication.

## Error Handling

| HTTP Status | Meaning | Suggested Action |
|-------------|---------|-----------------|
| 401 | Invalid or expired API Key | Check ATLASCLOUD_API_KEY |
| 402 | Insufficient balance | Top up at [Billing Page](https://www.atlascloud.ai/console/billing) |
| 429 | Rate limited | Wait and retry with exponential backoff |
| 5xx | Server error | Wait and retry |

## MCP Server Integration

If the user is using Claude Code or other MCP-compatible tools, they can install the Atlas Cloud MCP Server for a more native experience:

```bash
npx atlascloud-mcp
```

See [atlascloud-mcp](https://www.npmjs.com/package/atlascloud-mcp) for configuration details.
