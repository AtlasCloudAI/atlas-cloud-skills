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
- 🎬 **Video** (174) — Seedance 2.5 · MiniMax H3 · Youchuan V8.2 · Seedance 2.0 Mini · HappyHorse-1.1 · Gemini Omni Flash
- 🎨 **Image** (116) — Seedream v5.0 Pro · Qwen Image 3.0 · Reve 2.1 · Youchuan V8.2
- 🧊 **3D** (7) — Seed3D 2.0 · Hunyuan 3D Rapid · Hunyuan 3D Pro · Tripo H3.1
- 💬 **LLM** (64) — Grok 4.6 · DeepSeek V4 Flash 0731 · Qwen3.8 Max · Kimi K3
- 🔊 **Audio (TTS · Music · ASR)** (18) — Seed Audio 1.0 · xAI TTS v1 · ElevenLabs v3 · Suno chirp-v4-5-all

- 📚 **Explore more** — [all 395 live models »](https://www.atlascloud.ai/models?utm_source=github&utm_campaign=atlas-cloud-skills)
<!-- ATLAS-MODELS:END -->

## Contents

- [Supported Models](#supported-models)
- [Featured Recipes](#featured-recipes)
- [Available Skills](#available-skills)
  - [atlas-cloud](#atlas-cloud)
  - [seedance-2-5-skill](#seedance-2-5-skill)
  - [universal-video-prompt-skill](#universal-video-prompt-skill)
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

### seedance-2-5-skill

A model-specific sub-skill for controllable Seedance video, layered on top of `atlas-cloud`. Use it when a job needs shot planning rather than a single prompt:

- **Route selection first** — text-to-video, storyboard-image-to-video, asset-reference-to-video, first-and-last-frame, or extending an existing clip
- **Reference discipline** — how to assign people / product / scene / style / audio references so identity holds across shots
- **Shot craft** — camera, lighting and composition vocabulary, transition patterns, long-video continuity, real-person handling
- **Editing and extension** — rewriting part of an existing video, changing lighting or style, extending a short clip
- **Execution** — submits through Atlas Cloud (MCP, CLI or REST) and verifies model availability before a billable run
- Every reference ships in English and Simplified Chinese; Chinese requests follow a dedicated Chinese workflow

Works with [`universal-video-prompt-skill`](#universal-video-prompt-skill) when the same brief needs to run on more than one model. Prompt library for this model: [awesome-seedance-2.5-prompts-skills](https://github.com/AtlasCloudAI/awesome-seedance-2.5-prompts-skills)

### universal-video-prompt-skill

Model-agnostic companion to `seedance-2-5-skill`. It writes one prompt **spec** — scope, locks, staging, end states — separately from the dialect that expresses it, then compiles that spec for whichever video model you can actually call. Use it when:

- The same brief has to run on several models, or the target model is not available yet and the work must proceed elsewhere
- You are building a model-comparison matrix and need the prompts to differ only by dialect
- A prompt must survive a model swap instead of being rewritten

Each model carries a measured profile (reference syntax, limits, timing adherence, default-bias behaviour); the skill probes what it does not know, degrades the spec to what the model supports, and reports every degrade. English + Simplified Chinese references throughout.

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

Copy `atlas-cloud/` to `~/.claude/skills/atlas-cloud/`, and any sub-skill under `skills/` to `~/.claude/skills/<name>/`.

### Install one skill only

```bash
curl -fsSL https://raw.githubusercontent.com/AtlasCloudAI/atlas-cloud-skills/main/install.sh | sh -s atlas-cloud
curl -fsSL https://raw.githubusercontent.com/AtlasCloudAI/atlas-cloud-skills/main/install.sh | sh -s seedance-2-5-skill
curl -fsSL https://raw.githubusercontent.com/AtlasCloudAI/atlas-cloud-skills/main/install.sh | sh -s universal-video-prompt-skill
```

`seedance-2-5-skill` references `universal-video-prompt-skill`, so install both if you want cross-model prompt specs.

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
