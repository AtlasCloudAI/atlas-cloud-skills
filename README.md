# Atlas Cloud Skills

Claude Code skills for [Atlas Cloud](https://www.atlascloud.ai) — an AI API aggregation platform with 300+ image generation, video generation, and LLM models.

## Available Skills

### atlas-cloud

Quickly integrate Atlas Cloud API into your projects. This skill provides:

- Complete API reference for image generation, video generation, and LLM chat
- Ready-to-use code templates in Python, Node.js/TypeScript, and cURL
- Popular model IDs with pricing info
- OpenAI SDK compatibility guide for LLM models
- Error handling and best practices

## Installation

### Claude Code CLI

```bash
claude skill add --from https://github.com/AtlasCloudAI/atlas-cloud-skills
```

### Manual

Copy the `atlas-cloud/` directory to your Claude Code skills folder.

## Setup

1. Get an API Key at [Atlas Cloud Console](https://www.atlascloud.ai/console/api-keys)
2. Set the environment variable:

```bash
export ATLASCLOUD_API_KEY="your-api-key-here"
```

## What You Can Do

| Capability | Endpoint | Example Models |
|------------|----------|----------------|
| **Image Generation** | `POST /api/v1/model/generateImage` | Nano Banana 2, Seedream v5.0, Z-Image |
| **Video Generation** | `POST /api/v1/model/generateVideo` | Kling v3.0, Seedance v1.5, Vidu Q3 |
| **LLM Chat** | `POST /v1/chat/completions` | Qwen3.5, Kimi K2.5, DeepSeek V3.2, GLM 5 |

## MCP Server

For an even more native experience in Claude Code, install the [Atlas Cloud MCP Server](https://www.npmjs.com/package/atlascloud-mcp):

```bash
npx atlascloud-mcp
```

## Links

- [Atlas Cloud Website](https://www.atlascloud.ai)
- [API Documentation](https://www.atlascloud.ai/models)
- [MCP Server (npm)](https://www.npmjs.com/package/atlascloud-mcp)
- [Console / API Keys](https://www.atlascloud.ai/console/api-keys)
