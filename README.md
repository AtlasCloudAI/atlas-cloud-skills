# Atlas Cloud Skills

<p align="center">
  <a href="https://github.com/AtlasCloudAI/atlas-cloud-skills/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AtlasCloudAI/atlas-cloud-skills?style=flat&colorA=18181B&colorB=28CF8D" alt="License"></a>
  <a href="https://github.com/AtlasCloudAI/atlas-cloud-skills/stargazers"><img src="https://img.shields.io/github/stars/AtlasCloudAI/atlas-cloud-skills?style=flat&colorA=18181B&colorB=28CF8D" alt="Stars"></a>
  <a href="https://github.com/AtlasCloudAI/atlas-cloud-skills/pulls"><img src="https://img.shields.io/badge/PRs-welcome-28CF8D?style=flat&colorA=18181B&colorB=28CF8D" alt="PRs Welcome"></a>
  <a href="https://www.atlascloud.ai/models?utm_source=github&utm_campaign=atlas-cloud-skills"><img src="https://img.shields.io/badge/models-300%2B-28CF8D?style=flat&colorA=18181B&colorB=28CF8D" alt="300+ models"></a>
  <a href="https://github.com/AtlasCloudAI/atlas-cloud-skills"><img src="https://img.shields.io/badge/install-npx%20skills%20add-28CF8D?style=flat&colorA=18181B&colorB=28CF8D" alt="npx skills add"></a>
</p>

> 🎬 **Seedance 2.0 is now live on Atlas Cloud!** ByteDance's flagship video model — native audio-video joint generation, up to 15s cinematic output, up to 1440P, multimodal reference (up to 9 images + 3 videos + 3 audio clips), and director-level camera control. Available now: [Text-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/text-to-video?utm_source=github&utm_campaign=atlas-cloud-skills) · [Image-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/image-to-video?utm_source=github&utm_campaign=atlas-cloud-skills) · [Reference-to-Video](https://www.atlascloud.ai/models/bytedance/seedance-2.0/reference-to-video?utm_source=github&utm_campaign=atlas-cloud-skills) · [Fast variants](https://www.atlascloud.ai/models/bytedance/seedance-2.0-fast/text-to-video?utm_source=github&utm_campaign=atlas-cloud-skills) from **$0.076/s**.
>
> 🔓 **Need the full-power build?** The **unrestricted / full-capability pipeline** — fewer guardrails, broader subject range, max-fidelity output — is available through [Atlas Cloud Workflow](https://www.atlascloud.ai/console/workflow?utm_source=github&utm_campaign=atlas-cloud-skills). Hook it straight into your skill via the same API key.

Use [Atlas Cloud](https://www.atlascloud.ai?utm_source=github&utm_campaign=atlas-cloud-skills)'s 300+ image / video / LLM models inside Claude Code, Codex, Gemini CLI, and other AI coding agents. Generate images, videos & chat via curated Skills.

> **[→ Get your free Atlas Cloud API key](https://www.atlascloud.ai/console/api-keys?utm_source=github&utm_campaign=atlas-cloud-skills)** — 300+ models, one key, OpenAI-compatible.

## Supported Models

<!-- ATLAS-MODELS:START lang=en campaign=atlas-cloud-skills -->
<!-- ⚠️ Auto-generated from the live model catalog by AtlasCloudAI/.github/scripts/update-models-readme.mjs — do not edit by hand. -->
- 🎬 **Video** (170) — Seedance 2.0 Mini · HappyHorse-1.1 · Gemini Omni Flash · Avatar Omni Human 1.5 · Kling V3.0 Turbo · Kling Video O3 4K
- 🎨 **Image** (96) — Seedream v5.0 Pro · Nano Banana 2 Lite · MAI-Image-2.5-Flash · MAI-Image-2.5
- 🧊 **3D** (5) — Seed3D 2.0 · Hunyuan 3D Rapid · Hunyuan 3D Pro
- 💬 **LLM** (59) — Grok 4.5 · Kimi K3 · KAT Coder Pro V2.5 · KAT Coder Air V2.5
- 🔊 **Audio (TTS · Music · ASR)** (14) — Seed Audio 1.0 · xAI TTS v1 · ElevenLabs v3 · Suno chirp-auk

- 📚 **Explore more** — [all 366 live models »](https://www.atlascloud.ai/models?utm_source=github&utm_campaign=atlas-cloud-skills)
<!-- ATLAS-MODELS:END -->

## Contents

- [Supported Models](#supported-models)
- [Featured Recipes](#featured-recipes)
- [Available Skills](#available-skills)
- [Installation](#installation)
- [Setup](#setup)
- [What You Can Do](#what-you-can-do)
- [MCP Server](#mcp-server)
- [More Atlas Cloud Tools](#more-atlas-cloud-tools)

## Featured Recipes

Don't start from a blank prompt — start from a workflow. Three to try first:

- 🛍️ [**Product Render → 30-Second Ad**](library/motion/product-render-to-ad.md) — turn a product still into a short ad clip
- 🎭 [**Character Sheet → Multi-Shot AI Drama**](library/motion/character-to-drama.md) — one character, consistent across shots
- 📱 [**Long Video → Vertical Short**](library/social/long-to-vertical-short.md) — reframe + animate for TikTok / Reels / Shorts

**[Browse all 25 recipes in the library »](library/README.md)** — across 🎨 visual · 🎬 motion · ✂️ edit · 📱 social.

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

1. Get an API Key at [Atlas Cloud Console](https://www.atlascloud.ai/console/api-keys?utm_source=github&utm_campaign=atlas-cloud-skills)
2. Set the environment variable:

```bash
export ATLASCLOUD_API_KEY="your-api-key-here"
```

See [`.env.example`](.env.example) for a ready-to-copy template.

## What You Can Do

| Capability | Endpoint | Example Models |
|------------|----------|----------------|
| **Image Generation** | `POST /api/v1/model/generateImage` | Nano Banana 2, Seedream v5.0, Z-Image |
| **Video Generation** | `POST /api/v1/model/generateVideo` | Seedance 2.0, Kling v3.0, Vidu Q3 |
| **Audio — TTS & Music** | `POST /api/v1/model/generateAudio` | Seed Audio 1.0, Suno Chirp v5, MiniMax Music |
| **Speech-to-Text (ASR)** | `POST /api/v1/model/generateAudio` | Seed ASR 2.0, xAI STT |
| **3D Generation** | `POST /api/v1/model/generateImage` | Seed3D 2.0, Hunyuan 3D (image/text-to-3D) |
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

## More Atlas Cloud Tools

- 🧰 Want to use it from the terminal? → [atlascloud-cli](https://github.com/AtlasCloudAI/cli)
- 🤖 Want to use it in Claude Code / Cursor? → [Atlas Cloud MCP Server](https://github.com/AtlasCloudAI/mcp-server)
- 🎬 Want it as a Claude Code / Codex / Gemini CLI Skill? → [atlas-cloud-skills](https://github.com/AtlasCloudAI/atlas-cloud-skills)
- 🎨 ComfyUI nodes → [atlascloud_comfyui](https://github.com/AtlasCloudAI/atlascloud_comfyui)
- 🔁 n8n nodes → [n8n-nodes-atlascloud](https://github.com/AtlasCloudAI/n8n-nodes-atlascloud)
- 💬 Join our Discord → [discord.gg/MWmMr4q9es](https://discord.gg/MWmMr4q9es)
- 🌐 Website → [atlascloud.ai](https://www.atlascloud.ai?utm_source=github&utm_campaign=atlas-cloud-skills)

**Docs:** [Models & API](https://www.atlascloud.ai/models?utm_source=github&utm_campaign=atlas-cloud-skills) · [Console / API Keys](https://www.atlascloud.ai/console/api-keys?utm_source=github&utm_campaign=atlas-cloud-skills)
