# Atlas Cloud Skills

> 🎬 **Seedance 2.0 is now live on Atlas Cloud!** ByteDance's flagship video model — native audio-video joint generation, up to 15s cinematic output, 1080p, multimodal reference (up to 9 images + 3 videos + 3 audio clips), and director-level camera control. Available now: [Text-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/text-to-video) · [Image-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/image-to-video) · [Reference-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/reference-to-video) · [Fast variants](https://www.atlascloud.ai/models/bytedance/seedance-2.0-fast/text-to-video) from **$0.101/gen**.
>
> 🔓 **Need the full-power build?** The **unrestricted / full-capability pipeline** — fewer guardrails, broader subject range, max-fidelity output — is available through [Atlas Cloud Workflow](https://www.atlascloud.ai/console/workflow). Hook it straight into your skill via the same API key.

Claude Code skills for [Atlas Cloud](https://www.atlascloud.ai) — an AI API aggregation platform with 300+ image generation, video generation, and LLM models.

## Available Skills

### atlas-cloud

Quickly integrate Atlas Cloud API into your projects. This skill provides:

- Complete API reference for image generation, video generation, LLM chat, media upload, and quick generation
- All 9 MCP tools documented: `atlas_list_models`, `atlas_search_docs`, `atlas_get_model_info`, `atlas_generate_image`, `atlas_generate_video`, `atlas_quick_generate`, `atlas_chat`, `atlas_get_prediction`, `atlas_upload_media`
- Ready-to-use code templates in Python, Node.js/TypeScript, and cURL
- Popular model IDs with pricing info
- OpenAI SDK compatibility guide for LLM models
- Error handling, retry strategy, and best practices

## Installation

### One-Line Install

```bash
npx skills add AtlasCloudAI/atlas-cloud-skills
```

### Shell Script

```bash
curl -fsSL https://raw.githubusercontent.com/AtlasCloudAI/atlas-cloud-skills/main/install.sh | sh
```

### Manual

Copy the `atlas-cloud/` directory to `~/.claude/skills/atlas-cloud/`.

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
| **Video Generation** | `POST /api/v1/model/generateVideo` | Seedance 2.0, Kling v3.0, Vidu Q3 |
| **LLM Chat** | `POST /v1/chat/completions` | Qwen3.5, Kimi K2.5, DeepSeek V3.2, GLM 5 |
| **Upload Media** | `POST /api/v1/model/uploadMedia` | Upload local files to get public URLs |
| **Quick Generate** | Auto model search + submit | One-step generation by keyword |
| **Search Models** | Fuzzy search by keyword | Find models by name, type, or provider |

## MCP Server

For a more native experience, install the [Atlas Cloud MCP Server](https://www.npmjs.com/package/atlascloud-mcp):

### CLI Tools (One-Line Install)

```bash
# Claude Code
claude mcp add atlascloud -- npx -y atlascloud-mcp

# Gemini CLI
gemini mcp add atlascloud -- npx -y atlascloud-mcp

# OpenAI Codex CLI
codex mcp add atlascloud -- npx -y atlascloud-mcp
```

### IDEs & Editors (JSON Config)

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

Supports Cursor, Windsurf, VS Code (Copilot), Trae, Zed, JetBrains, Claude Desktop, ChatGPT Desktop, Amazon Q Developer, Cline, Roo Code, Continue, and all MCP-compatible clients.

## Links

- [Atlas Cloud Website](https://www.atlascloud.ai)
- [API Documentation](https://www.atlascloud.ai/models)
- [MCP Server (npm)](https://www.npmjs.com/package/atlascloud-mcp)
- [MCP Server (GitHub)](https://github.com/AtlasCloudAI/mcp-server)
- [Console / API Keys](https://www.atlascloud.ai/console/api-keys)
