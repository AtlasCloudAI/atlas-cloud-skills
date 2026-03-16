---
name: atlas-cloud
description: "Atlas Cloud API integration skill — quickly call 300+ AI image generation, video generation, and LLM models through a unified API. Use this skill when the user needs to integrate AI image generation (e.g., Flux, Seedream, DALL-E), AI video generation (e.g., Kling, Sora, Seedance), or call LLM APIs (OpenAI-compatible format) into their project. Applicable scenarios include: generating images, generating videos, calling large language models, using Atlas Cloud API, configuring ATLASCLOUD_API_KEY, querying available model lists, searching models by keyword, uploading local images/media files, one-step quick generation, image-to-video, text-to-image, text-to-video, AI content creation tool integration. Even if the user doesn't explicitly mention Atlas Cloud, this skill should be considered whenever AI media generation API integration development is involved."
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

Atlas Cloud has the following API endpoints:

| Endpoint | Base URL | Purpose |
|----------|----------|---------|
| **Media Generation API** | `https://api.atlascloud.ai/api/v1` | Image generation, video generation, poll results, upload media |
| **LLM API** | `https://api.atlascloud.ai/v1` | Chat completions (OpenAI-compatible) |

All requests require the following headers:
```
Authorization: Bearer $ATLASCLOUD_API_KEY
Content-Type: application/json
```

### Full Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/model/generateImage` | Submit image generation task |
| `POST` | `/api/v1/model/generateVideo` | Submit video generation task |
| `GET` | `/api/v1/model/prediction/{id}` | Check generation task status and result |
| `POST` | `/api/v1/model/uploadMedia` | Upload local media file to get a public URL |
| `POST` | `/v1/chat/completions` | LLM chat (OpenAI-compatible format) |
| `GET` | `api.atlascloud.ai/api/v1/models` | List all available models (no auth required) |

## MCP Tools (9 Tools)

If the user has installed the Atlas Cloud MCP Server (`npx atlascloud-mcp`), the following 9 tools are available for direct invocation:

### Model Discovery Tools

#### `atlas_list_models` — List All Models
- **Params**: `type` (optional): `"Text"` | `"Image"` | `"Video"`
- **Purpose**: List all available models, optionally filtered by type
- **Examples**: No params to list all; `type="Image"` for image models only

#### `atlas_search_docs` — Search Models & Docs
- **Params**: `query` (required): Search keyword matching model names, types, providers, tags
- **Purpose**: Fuzzy search models by keyword. Returns detailed API schema info when there's only one match
- **Examples**: `"video generation"`, `"deepseek"`, `"image edit"`, `"qwen"`

#### `atlas_get_model_info` — Get Model Details
- **Params**: `model` (required): Model ID, e.g. `"deepseek-ai/deepseek-v3.2"`
- **Purpose**: Get full model info including API docs, input/output schema, pricing, cURL examples, Playground link
- **Examples**: `model="deepseek-ai/deepseek-v3.2"`

### Generation Tools

#### `atlas_generate_image` — Generate Image
- **Params**:
  - `model` (required): Exact image model ID
  - `params` (required): Model-specific parameter JSON object (e.g. `prompt`, `image_size`, etc.)
- **Purpose**: Submit image generation task, returns prediction ID. Must verify model ID first via `atlas_list_models` or `atlas_search_docs`
- **Returns**: prediction ID — use `atlas_get_prediction` to check result

#### `atlas_generate_video` — Generate Video
- **Params**:
  - `model` (required): Exact video model ID
  - `params` (required): Model-specific parameter JSON object (e.g. `prompt`, `duration`, `aspect_ratio`, `image_url`, etc.)
- **Purpose**: Submit video generation task, returns prediction ID
- **Returns**: prediction ID — video generation typically takes 1-5 minutes

#### `atlas_quick_generate` — Quick Generate (One-Step)
- **Params**:
  - `model_keyword` (required): Model search keyword, e.g. `"nano banana"`, `"seedream"`, `"kling v3"`
  - `type` (required): `"Image"` | `"Video"`
  - `prompt` (required): Text description of what to generate
  - `image_url` (optional): Source image URL for image-to-video or image editing models
  - `extra_params` (optional): Additional model-specific parameters to override defaults
- **Purpose**: One-step generation — automatically searches model → fetches schema → builds params → submits task. No need to know exact model IDs
- **Examples**: `model_keyword="seedream v5", type="Image", prompt="a cute cat"`

#### `atlas_chat` — LLM Chat
- **Params**:
  - `model` (required): LLM model ID
  - `messages` (required): Array of message objects with `role` and `content`
  - `temperature` (optional): Sampling temperature 0-2
  - `max_tokens` (optional): Maximum response tokens
  - `top_p` (optional): Nucleus sampling parameter 0-1
- **Purpose**: Send OpenAI-compatible chat completion request

### Utility Tools

#### `atlas_get_prediction` — Check Generation Result
- **Params**: `prediction_id` (required): Prediction ID returned from a generation request
- **Purpose**: Check image/video generation task status and result
- **Status values**: `starting` → `processing` → `completed`/`succeeded`/`failed`
- **On completion**: Returns output URL list — can download locally via curl/wget

#### `atlas_upload_media` — Upload Media File
- **Params**: `file_path` (required): Absolute path to the local file
- **Purpose**: Upload local image/media file to Atlas Cloud and get a publicly accessible URL. Use this to provide `image_url` for image editing or image-to-video models
- **Workflow**:
  1. Upload local file with this tool to get a URL
  2. Use the returned URL as the `image_url` parameter for `atlas_generate_image`, `atlas_generate_video`, or `atlas_quick_generate`
- **Note**: Only for Atlas Cloud generation tasks. Uploaded files are temporary and will be cleaned up periodically. Uploading content unrelated to generation tasks (e.g., bulk hosting, illegal content, or abuse) may result in API key suspension

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

## Upload Media

Upload a local file to Atlas Cloud to get a publicly accessible URL. This is required when you need to provide an `image_url` to image-editing or image-to-video models but only have a local file.

### Upload Endpoint

```
POST https://api.atlascloud.ai/api/v1/model/uploadMedia
Content-Type: multipart/form-data
Authorization: Bearer $ATLASCLOUD_API_KEY
```

Request: multipart form data with a `file` field containing the file binary.

Response:
```json
{
  "code": 200,
  "data": {
    "download_url": "https://atlas-img.oss-accelerate-overseas.aliyuncs.com/media/xxx.jpg",
    "filename": "photo.jpg",
    "size": 123456
  }
}
```

### Workflow: Local Image → Image-to-Video

1. Upload local image → get URL
2. Use URL as `image_url` parameter in generation request

**Important**: This upload endpoint is strictly for temporary use with Atlas Cloud generation tasks. Uploaded files will be cleaned up periodically. Do NOT use this as permanent file hosting, CDN, or for any purpose unrelated to Atlas Cloud image/video generation. Abuse (e.g., bulk uploads, hosting illegal or unrelated content) may result in immediate API key suspension.

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
- **`references/upload.md`** — Media file upload implementation (Python / Node.js / cURL)
- **`references/quick-generate.md`** — Quick generation with auto model search (Python / Node.js)
- **`references/models.md`** — Popular model ID quick reference

Read the corresponding reference file when you need to write specific integration code.

## IMPORTANT: Always Verify Model IDs

Model IDs change frequently as new versions are released and old ones are deprecated. **Unless you are 100% certain of an exact model ID, always fetch the real model list first** before writing any integration code:

```
GET https://api.atlascloud.ai/api/v1/models
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
GET https://api.atlascloud.ai/api/v1/models
```
This endpoint requires no authentication.

## Error Handling

| HTTP Status | Meaning | Suggested Action |
|-------------|---------|-----------------|
| 401 | Invalid or expired API Key | Check ATLASCLOUD_API_KEY |
| 402 | Insufficient balance | Top up at [Billing Page](https://www.atlascloud.ai/console/billing) |
| 429 | Rate limited | Wait and retry with exponential backoff |
| 5xx | Server error | Wait and retry |

### Retry Strategy

- **GET requests**: Auto retry up to 3 times with exponential backoff (1s → 2s → 4s)
- **POST requests**: Do NOT retry — generation requests may create billable tasks, retrying could cause duplicate charges

## MCP Server Installation

Atlas Cloud MCP Server provides 9 tools for direct use in any MCP-compatible client. Prerequisites: Node.js >= 18 and an [Atlas Cloud API Key](https://www.atlascloud.ai/console/api-keys).

### CLI Tools (One-Line Install)

```bash
# Claude Code
claude mcp add atlascloud -- npx -y atlascloud-mcp

# Gemini CLI
gemini mcp add atlascloud -- npx -y atlascloud-mcp

# OpenAI Codex CLI
codex mcp add atlascloud -- npx -y atlascloud-mcp

# Goose CLI
goose mcp add atlascloud -- npx -y atlascloud-mcp
```

> For CLI tools, make sure to set the `ATLASCLOUD_API_KEY` environment variable in your shell:
> ```bash
> export ATLASCLOUD_API_KEY="your-api-key-here"
> ```

### IDEs & Editors (JSON Config)

Add to your MCP configuration file — works with all MCP-compatible IDEs and editors:

```json
{
  "mcpServers": {
    "atlascloud": {
      "command": "npx",
      "args": ["-y", "atlascloud-mcp"],
      "env": {
        "ATLASCLOUD_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

| Client | Config Location |
|--------|----------------|
| [Cursor](https://cursor.com) | Settings → MCP → Add Server |
| [Windsurf](https://codeium.com/windsurf) | Settings → MCP → Add Server |
| [VS Code (Copilot)](https://code.visualstudio.com) | `.vscode/mcp.json` or Settings → MCP |
| [Trae](https://trae.ai) | Settings → MCP → Add Server |
| [Zed](https://zed.dev) | Settings → MCP |
| [JetBrains IDEs](https://www.jetbrains.com) | Settings → Tools → AI Assistant → MCP |
| [Claude Desktop](https://claude.ai/download) | `claude_desktop_config.json` |
| [ChatGPT Desktop](https://openai.com/chatgpt/desktop) | Settings → MCP |
| [Amazon Q Developer](https://aws.amazon.com/q/developer/) | MCP Configuration |

### VS Code Extensions

These VS Code extensions also support MCP with the same JSON config format:

| Extension | Install |
|-----------|---------|
| [Cline](https://github.com/cline/cline) | MCP Marketplace → Add Server |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | Settings → MCP → Add Server |
| [Continue](https://continue.dev) | `config.yaml` → MCP |

### Skills Version (Alternative)

If you prefer using Skills instead of MCP:

```bash
npx skills add AtlasCloudAI/atlas-cloud-skills
```
