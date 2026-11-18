---
name: atlas-cloud
description: "Atlas Cloud API integration skill — quickly call 300+ AI image generation, video generation, audio (TTS, music, speech-to-text), 3D generation, and LLM models through a unified API. Use this skill when the user needs to integrate AI image generation (e.g., Flux, Seedream, DALL-E), AI video generation (e.g., Kling, Sora, Seedance), call LLM APIs (OpenAI-compatible format), generate speech/TTS or music (e.g., Seed Audio, Suno), transcribe audio to text (ASR), or turn images/text into 3D assets into their project. Also covers model discovery and keyword search, uploading local images/media files, one-step quick generation, and configuring ATLASCLOUD_API_KEY. Even if the user doesn't explicitly mention Atlas Cloud, this skill should be considered whenever AI media generation API integration development is involved."
---

# Atlas Cloud API Integration Guide

Atlas Cloud is an AI API aggregation platform that provides access to 300+ image, video, audio (TTS · music · speech-to-text), 3D, and LLM models through a unified interface. This skill helps you quickly integrate Atlas Cloud API into any project.

## Read this first when Atlas tools are in your tool list or the user mentions Atlas Cloud

If your tool list includes Atlas Cloud MCP tools (`atlas_generate_image`, `atlas_generate_video`,
`atlas_get_prediction`, `atlas_get_upload_url`, ...), the user is connected to Atlas Cloud through
the Atlas Cloud plugin or connector (Codex, Claude Code, Cursor, ChatGPT, Claude, WorkBuddy and
other MCP clients). Then, for anything the user wants generated:

1. **Use only those tools.** Do not call `api.atlascloud.ai` yourself with curl or a script, and do
   not look for `ATLASCLOUD_API_KEY` — there is none; the plugin already signed the user in. The
   REST examples further down this page are for developers integrating Atlas into their own code.
2. **Inputs are URLs.** Pass every image, video or audio input as a URL; never inline a file as
   base64 or a `data:` URI.
   - **A file on the user's machine or in your sandbox**: call `atlas_get_upload_url`, POST the file
     to the `upload_url` it returns (wait for that curl to finish), and pass the `url` from its
     response to the generation tool. Do not ask the user to pick or attach a file you can read.
   - **A file the user already has on Atlas Cloud** (an earlier upload or result: "my product
     photo", "the video I made yesterday"): find it with `atlas_search_assets`, then either get an
     input URL with `atlas_use_assets` or pass `asset://<asset_id>` to the generation tool. Do not
     ask the user to upload it again.
   - **Files attached in a ChatGPT chat**: `atlas_import_chat_files`.
   - **Only when you cannot upload it yourself** (the file is only on the user's device, you cannot
     run commands, or the upload failed): `atlas_open_upload_card`, in apps that show Atlas cards,
     opens a card where the user picks the file. Call it as the only tool in that turn and wait.
3. **Never claim a result you did not get.** Atlas tools can take a few seconds to load after a
   chat starts, and again at the start of a new turn, often right after the user confirms a quote.
   If they are missing from your tool list, wait about 5 seconds and look again, up to 3 times. If a
   call fails with "is not a function", that call never reached Atlas and nothing was spent, even
   when the tool is listed: wait about 5 seconds (in a JavaScript cell,
   `await new Promise(r => setTimeout(r, 5000))`) and make the exact same call again, same tool and
   same arguments, up to 3 times, before you tell the user anything. Do not switch to a different
   Atlas tool to get around it; a confirmation only works with the tool that quoted it. Try again on
   every new user message too; never repeat an earlier "not connected" or "could not submit"
   without trying. If it still fails after that, tell the user plainly that Atlas is not reachable
   right now and nothing was generated. Do not say an image or video was made unless a tool call returned it. Do not switch
   to another generator (such as a built-in image tool) instead: the user asked for Atlas, so ask
   them to sign in or retry rather than handing back a result from somewhere else.
4. **Pick the model by the default route, not by price.** A model the user names always wins.
   Otherwise follow the default route in the generation tool descriptions — video: Seedance 2.5 →
   Kling 4.0 → Wan 3.0 → Seedance 2.0; image: Seedream 5.0 Pro → GPT Image 2.5 Sunburst → Nano
   Banana 2.1 → GPT Image 2 — and pass `why_this_model` with one short reason it fits (it is shown
   on the quote card). For product ads, UGC videos, try-on or e-commerce listing images, check
   `atlas_list_models` with `type: "Workflow"` first: a ready-made workflow usually fits better than
   assembling base models.
5. **Quote first, then generate, then show.** To tell the user what something will cost, call the
   generation tool itself with their settings and without `confirmed`. That call is free: it prices
   this exact request, returns the billing account and a confirmation_token, and stops. Relay the
   model, the cost and the billing account, and wait for a yes. Do this even when the user only asks
   what it would cost: prices from `atlas_get_model_info`, `atlas_list_models` or the tables on this
   page are for choosing a model, not a quote. Only after a new user message explicitly confirms,
   call again with the same arguments, `confirmed: true`, and the idempotency_key and
   confirmation_token shown in the quote. Words such as "continue", "retry" or "keep going" never
   authorize a new quote or another submission. Poll `atlas_get_prediction` in the same turn until
   it finishes, save the result locally and show it with `![title](/absolute/path/file.ext)`.
6. **Apps that show Atlas cards** (for example ChatGPT, Claude and Cursor; Codex and Claude Code
   show none): the quote arrives as a card with the model, the price and a confirm button. Point the
   user to the card in one short sentence instead of repeating the quote or drawing your own. If the
   user confirms on the card, the card submits the job and tracks it to the result: do not call the
   generation tool again for it. If they confirm in the chat instead, call again as in step 5 (the
   same idempotency_key returns the job the card already started rather than a second one). When
   the user declines a quote or changes a quoted request, withdraw the old quote with
   `atlas_cancel_quote` (reason `declined` or `replaced`) so its card can no longer submit it.

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
| `POST` | `/api/v1/model/generateAudio` | Submit audio task — TTS, music generation, speech-to-text (ASR) |
| `GET` | `/api/v1/model/prediction/{id}` | Check generation task status and result |
| `POST` | `/api/v1/model/uploadMedia` | Upload local media file to get a public URL |
| `POST` | `/v1/chat/completions` | LLM chat (OpenAI-compatible format) |
| `GET` | `api.atlascloud.ai/api/v1/models` | List all available models (no auth required) |

## MCP Tools

> **Using this through the Atlas Cloud plugin or connector (no API key needed)**
>
> The [Atlas Cloud plugin](https://github.com/AtlasCloudAI/atlas-cloud-plugin) for Codex, Claude
> Code and Cursor, and the Atlas Cloud connector in ChatGPT, Claude, WorkBuddy and other MCP
> clients, connect to the hosted MCP server `https://mcp.atlascloud.ai/mcp` (named `atlas-cloud`),
> whose credentials come from **one browser sign-in by the user**, not from `ATLASCLOUD_API_KEY`.
> Generation is billed to the user's own Atlas account.
>
> In that environment:
> - **Do not** ask the user to create, copy or paste an API key, and do not use the
>   `npx atlascloud-mcp` install below — that route is for a standalone server with its own key.
> - Sign-in: the Atlas sign-in page opens in the browser when the plugin is installed, or on the
>   first Atlas tool call. Ask the user to finish it there and come back. If it never opened (or
>   was closed):
>   - **Codex**: in the Codex app, open **Settings**, find **atlas-cloud** in the MCP servers list
>     and click its sign-in (Authenticate) button. Only a user working in the Codex CLI in a
>     terminal should run `codex mcp login atlas-cloud`.
>   - **Claude Code**: run `/mcp`, pick **plugin:atlas-cloud:atlas-cloud** and choose
>     **Authenticate**. From a terminal, `claude mcp login plugin:atlas-cloud:atlas-cloud` does the
>     same.
>   - **Cursor**: open **Customize → MCPs** (or **Cursor Settings → MCP**), find **atlas-cloud**
>     and click its sign-in button.
>   - **ChatGPT, Claude, WorkBuddy and other apps**: reconnect the Atlas Cloud app or connector in
>     that app's settings.
>
>   Do not send app users to a terminal, and never ask for an API key.
> - Every generation is quoted before it runs. Pick the model and parameters yourself — do not
>   ask the user to choose a model or a budget first unless they asked to choose. When they did not
>   name a model, follow the default route (see "Read this first") and pass `why_this_model`. Call
>   the generation tool once to get the live quote, then in one short message show the model, the
>   key parameters and the price, and wait for an explicit yes before calling again with
>   `confirmation_token`; in apps that show Atlas cards, point the user to the card instead. Do this
>   for each billable step (a storyboard image, then the video).
> - Everything else on this page still applies: the tool names, parameters, the mandatory
>   two-call billing flow, and every reference doc. Only the credential differs.
>
> When the user wants to **integrate Atlas into their own project**, keep following the references
> below — that case does need their own API key. Rule of thumb: "generate X for me" → use the
> tools; "help me integrate X" → give them code.

### Which tools you have

The tools depend on how you are connected and on the client. **Check your own tool list rather
than assuming.**

| Connection | Tools |
|---|---|
| Local server (`npx atlascloud-mcp`) | 19: every tool below except the two card tools (`atlas_open_upload_card`, `atlas_cancel_quote`), so including `atlas_upload_media` (it reads your disk); the card tools too when card support is turned on |
| Hosted, in Codex or Claude Code | 17: everything except `atlas_upload_media` and `atlas_import_chat_files`. No cards |
| Hosted, in ChatGPT | 18 (adds `atlas_import_chat_files`), plus `atlas_open_upload_card` and `atlas_cancel_quote` for the cards |
| Hosted, in Claude (web and desktop) | The same 17 as Codex, plus `atlas_open_upload_card` and `atlas_cancel_quote` for the cards |
| Hosted, in Cursor, WorkBuddy and other clients | 18 (with `atlas_import_chat_files`), plus `atlas_open_upload_card` and `atlas_cancel_quote` when the client shows cards |

Apps that show cards also use card-only tools (such as `atlas_card_status`) that are hidden from
you; never try to call them.

### Model Discovery Tools

#### `atlas_list_models` — List All Models
- **Params**: `type` (optional): `"Text"` | `"Image"` | `"Video"` | `"Audio"` | `"Workflow"`; `limit`, `offset` (optional paging)
- **Type notes**: 3D models are Image-type; TTS, music, and speech-to-text models are Audio-type; lipsync / talking-avatar models are Video-type
- **Workflow**: `type="Workflow"` lists Atlas Cloud's ready-made marketing workflows — product ad images, UGC ads, brand TVC, virtual try-on, listing image sets, A+ content, apparel photos, food motion, and cloning a reference image or video with the user's own product — with each one's model ID, required inputs and options. They run with `atlas_generate_image` or `atlas_generate_video` like any other model; check them first for marketing content
- **Purpose**: List all available models, optionally filtered by type
- **Examples**: No params to list all; `type="Image"` for image models only; `type="Workflow"` for workflows

#### `atlas_get_model_info` — Get Model Details
- **Params**: `model` (required): Model ID, e.g. `"deepseek-ai/deepseek-v3.2"`
- **Purpose**: Get full model info including API docs, input/output schema, pricing, cURL examples, Playground link. Its prices help choose a model; the quote for a request comes from the generation tool (see the two-call billing flow below)
- **Examples**: `model="deepseek-ai/deepseek-v3.2"`

#### `atlas_search_docs` — Search the Help Docs
- **Params**: `query` (required): English keywords for the question (translate the user's question if needed)
- **Purpose**: Search the Atlas Cloud help documentation — accounts and teams, API keys, billing, top-ups, refunds and failed tasks, uploading files, webhooks, errors and rate limits, data retention, the MCP server, CLI and Skills. Returns up to 5 pages (title, link, summary, the most relevant passage); answer from them and give the user the link. If the query also names models, matching models are listed after the pages
- **Not for picking a model**: it is not needed before a generation — use `atlas_list_models` and `atlas_get_model_info` for that
- **Examples**: `"upload file"`, `"refund failed task"`, `"webhook"`, `"rate limit"`

### Generation Tools

**Two-call billing flow.** A generation tool called without `confirmed` only quotes: it is free,
prices this exact request, and returns the model, the estimated cost, the billing account, an
`idempotency_key` and a `confirmation_token`, and nothing starts. Show the user that quote (or
point to the quote card) and wait for a yes in a new message; then call again with the same
arguments, `confirmed: true`, the same `idempotency_key` and the `confirmation_token`. Send the
token back even if you think it may have lapsed: the server checks expiry itself. To tell the user
what a request will cost, always make that quote call, even when they only ask about the price. A
deployment may set an auto-submit limit; a call under it starts right away, and then you tell the
user the amount. After submission, poll the prediction instead of calling a generation tool again.

**Parameters every generation tool shares**: `idempotency_key`, `confirmed` and
`confirmation_token` (the flow above), and `why_this_model` — one short sentence on why the model
fits, shown on the quote card; pass it whenever you picked the model yourself, and leave it out
when the user named the model. Parameters are validated against the model's live schema before
anything is submitted: a missing, mistyped or out-of-range value is rejected with an error and
nothing is spent.

**Input files** are public URLs (see "Uploading a local file" below) or `asset://<asset_id>` for a
file in the user's Asset Library; the server swaps in a fresh file URL. Base64 and `data:` URIs
are rejected.

#### `atlas_generate_image` — Generate Image
- **Params**:
  - `model` (required): Exact image model ID
  - `params` (required): Model-specific parameter JSON object (e.g. `prompt`, `image_size`, etc.)
- **Purpose**: Submit image generation task, returns prediction ID. Must verify model ID first via `atlas_list_models` or `atlas_get_model_info`
- **Default route** when the user names no model: Seedream 5.0 Pro → GPT Image 2.5 Sunburst → Nano Banana 2.1 → GPT Image 2 (the tool description has the exact IDs and default settings)
- **Returns**: prediction ID — use `atlas_get_prediction` to check result

#### `atlas_generate_video` — Generate Video
- **Params**:
  - `model` (required): Exact video model ID
  - `params` (required): Model-specific parameter JSON object (e.g. `prompt`, `duration`, `aspect_ratio`, `image_url`, etc.)
- **Purpose**: Submit video generation task, returns prediction ID
- **Default route** when the user names no model: Seedance 2.5 → Kling 4.0 → Wan 3.0 → Seedance 2.0, at 720p and 5 seconds unless the user asks otherwise (the tool description has the exact IDs)
- **Returns**: prediction ID — video generation typically takes 1-5 minutes

#### `atlas_generate_audio` — Generate Audio (TTS & Music)
- **Params**:
  - `model` (required): Exact audio model ID (e.g. `"bytedance/seed-audio-1.0"`, `"suno/chirp-v6"`, `"minimax/music-2.6"`)
  - `params` (required): Model-specific JSON — TTS models usually take `text`; music models usually take `prompt` and/or `lyrics`
- **Purpose**: Submit audio generation task — covers BOTH text-to-speech and music/song generation
- **Returns**: prediction ID — the output is an audio file URL

#### `atlas_transcribe_audio` — Transcribe Audio (Speech-to-Text)
- **Params**:
  - `model` (required): Exact speech-to-text model ID (e.g. `"bytedance/seed-asr-2.0"`)
  - `params` (required): Model-specific JSON — main field is usually `audio_url`; for local files upload them first (see "Uploading a local file" below — the tool differs between hosted and local connections)
- **Purpose**: Transcribe speech to text (ASR) — meetings, interviews, voice notes
- **Returns**: prediction ID — the output is the transcribed text

#### `atlas_quick_generate` — Quick Generate (One-Step)
- **Params**:
  - `type` (required): `"Image"` | `"Video"` | `"Audio"`
  - `prompt` (required): Text description of what to generate
  - `model_keyword` (optional): An exact model ID from `atlas_list_models`, or a distinctive keyword such as `"nano banana"`, `"seedream"`, `"kling v4"`. Omitted for an image or video, the server applies the default route (the edit or image-to-video variant when `image_url` is given)
  - `image_url` (optional): Source image URL for image-to-video, image editing, image-to-3D, or talking-avatar models
  - `audio_url` (optional): Source audio URL for lipsync / talking-avatar or speech-to-text models
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
  - `idempotency_key` / `confirmation_token`: same as the generation tools
- **Purpose**: Send OpenAI-compatible chat completion request
- **Cost**: billed per token to the user's account, under the same spend rule as generation. The server bounds the worst case of the exact request (input size plus `max_tokens`, or the model's output limit, at its highest rates): under the auto-submit limit it runs and reports the cost from actual usage; otherwise it returns `confirmation_required` with that bound and spends nothing. Setting `max_tokens` keeps the bound small.

### Utility Tools

#### `atlas_get_prediction` — Check Generation Result
- **Params**: `prediction_id` (required): Prediction ID returned from a generation request
- **Purpose**: Check image/video generation task status and result
- **Status values**: `starting` → `processing` → `completed`/`succeeded`/`failed`
- **Polling**: the server waits up to about 20 seconds for an unfinished task before it answers, so call `atlas_get_prediction` again right away while the task is still running, and keep polling in the same turn until it finishes. Never end your turn while a task is still processing, and never resubmit it. In apps that show Atlas cards, a card that is already tracking the task turns into the result by itself; the tool result says so, and then you do not poll it.
- **On completion**: follow the presentation notes in the result; they depend on the client. Where you have a shell (Codex, Claude Code, Cursor), save each file with `curl -L --fail --max-time 600 -o "<descriptive-name>.<ext>" "<url>"`, wait until that command has actually exited (a shell tool can hand back control while curl is still writing — a half-written file shows as broken), and then show it with Markdown image syntax and the absolute path: `![<title>](/absolute/path/<name>.mp4)`. The leading `!` is what renders a player for video and the picture for an image; a plain link `[title](path)` only shows a file chip, and an HTML `<video>` tag is printed as text. Never put a remote Atlas URL inside image syntax: the storage refuses requests from the app and it renders as a broken image. If the sandbox has no network, ask to run that one download with network access. If the result says the file is still being copied to Atlas storage, poll again for the permanent link instead of downloading the temporary provider link. Speech-to-text and lyrics models return the text itself — nothing to download.

#### `atlas_list_predictions` — Recent Tasks
- **Params**: `page`, `size` (max 50), `state` (`"running"` | `"succeeded"` | `"failed"`), `model` (exact ID) or `model_prefix` (a family), all optional
- **Purpose**: Find a task ID the user lost, see what was generated earlier, or review failed runs, newest first. It reads history only. Each entry has `source` (which app started it), `charged_usd` (what was actually charged) and the outputs; answer "what did it cost" from `charged_usd`, not from the earlier quote. In apps with cards, check it before saying a quote is still waiting, was not charged, or is generating — the user may have confirmed it on the card

#### `atlas_cancel_quote` — Withdraw a Quote (apps with Atlas cards)
- **Params**: `tool` (the generation tool that quoted), `idempotency_key` (of that quote), `reason` (`"declined"` | `"replaced"`)
- **Purpose**: When the user declines a quote ("not that one", "never mind") or changes a quoted request (another duration, size, model or prompt), withdraw the old quote so its card can no longer submit it. Nothing is charged; a quote that was already submitted cannot be canceled, and the result says so

### Asset Library Tools

The Asset Library holds the files the user uploaded on atlascloud.ai and the inputs and results of
their earlier generations. It has to be activated on the account (it opens after a top-up); when
it is not, the result says so.

#### `atlas_search_assets` — Search the Asset Library
- **Params**: `query` (optional): words to match names and descriptions; `media_type` (optional): `"image"` | `"video"` | `"audio"` | `"3d"`; `limit` (default 12, max 50); `cursor` (from the previous page)
- **Purpose**: Find something the user already has ("use my product photo", "the video I made yesterday") instead of asking them to upload it again. Reads only. In apps that show cards, the results open in an Asset Library card where the user can pick assets themselves

#### `atlas_use_assets` — Turn Assets into Input URLs
- **Params**: `asset_ids` (required): `asset_id` values from `atlas_search_assets`
- **Purpose**: Get temporary file URLs (about 15 minutes) for those assets, to pass as image / video / audio inputs right before generating; it also reports each image's size and shape. Nothing is billed. Do not show these URLs to the user or store them: they are signed links to private files. Passing `asset://<asset_id>` straight to a generation tool works too

#### Uploading a local file — which tool exists depends on how you are connected

**Check your tool list first.** A hosted server does not expose `atlas_upload_media` at all,
because it cannot read your disk.

**`atlas_get_upload_url` — hosted connection, the default** (Codex, Claude Code, Cursor, ChatGPT, Claude, WorkBuddy, anything pointed at `https://mcp.atlascloud.ai/mcp`)
- **Params**: `filename_hint` (optional)
- **Workflow**:
  1. Call it once to get an upload ticket
  2. POST the file with the `curl_example` it returns — put the filename, extension included, in the `X-Atlas-Filename` header. That one curl needs no API key: the ticket already carries your identity and points at the connector's own relay, not at Atlas's REST API
  3. Use the `url` from the response (it also has `asset_id` when the file was saved to the user's Asset Library)
- One ticket accepts several files while it is valid (about 10 minutes). Uploading is not billed.
- Use it for any file whose bytes you can read — a path on this machine or a file in your sandbox. Do not ask the user to pick or attach that file again.

**`atlas_open_upload_card` — fallback in apps that show Atlas cards**
- Only when you cannot upload the file yourself: it is only on the user's device, you cannot run commands or reach the network, or the upload failed. It opens a card where the user picks the files; call it as the only tool in that turn, tell the user to add the files in the card, and wait for the URLs to arrive.

**`atlas_import_chat_files` — files attached in a ChatGPT chat**
- Stores the attached files in Atlas Cloud and returns URLs for the generation tools. Listed only for clients that pass attachments as download links (ChatGPT, and the local server).

**`atlas_upload_media` — local stdio** (the `atlascloud-mcp` npm package)
- **Params**: `file_path` (required): Absolute path to the local file
- Reads the file directly and returns the URL.

Either way, pass the returned URL as `image_url` (or the model's image / video / audio parameter) for `atlas_generate_image` / `atlas_generate_video` / `atlas_quick_generate`, or as the audio parameter for `atlas_transcribe_audio`.

**Size limits** come back with the ticket (`max_bytes`, plus `max_video_bytes` when present): 32 MB
per file by default; when uploads are saved to the user's Asset Library (accounts with the Asset
Library activated), 50 MB for images and audio and 100 MB for video and 3D files.

**Three cases where you must say so plainly instead of claiming an upload**: the file is over the
limit (common for long video), none of these tools is in your list (a server that predates the
ticket flow), or the curl failed / the response carried no `url`. Ask for a public link in those
cases. Passing a local path straight to a generation tool always fails — do not try it.

- **Note**: Uploads are for Atlas Cloud generation inputs, not general file hosting; uploading content unrelated to generation (bulk hosting, illegal content or other abuse) may get the account suspended. When an upload is saved to the Asset Library, the returned `url` is a short-lived signed link (about 15 minutes): if it has expired, call `atlas_use_assets` with the `asset_id` for a fresh one.

### Account Tools

#### `atlas_get_balance` — Account Balance
- **Params**: none
- **Purpose**: Get the balance and credit summary of the signed-in account (or of the API key, on a local server)

#### `atlas_get_model_usage` — Daily Usage
- **Params**: `start_date`, `end_date` (optional date range)
- **Purpose**: Per-day model usage (requests, tokens, image/video counts)

#### `atlas_get_model_costs` — Daily Costs
- **Params**: `start_date`, `end_date` (optional date range)
- **Purpose**: Per-day spend buckets per model

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
  "model": "bytedance/seedance-2.0/text-to-video",
  "prompt": "A rocket launching into space, cinematic lighting",
  "duration": 5,
  "resolution": "1080p",
  "ratio": "16:9",
  "generate_audio": true
}
```

Common video model parameters:
- `prompt` (required for T2V): Video description
- `image` / `image_url`: Input image (for image-to-video models — Seedance 2.5 uses `image`, Kling uses `image_url`)
- `duration`: Video duration in seconds (Seedance 2.5 supports 4-30, Seedance 2.0 supports 4-15, or `-1` for auto)
- `resolution`: `"480p"` / `"720p"` / `"1080p"` native; Seedance 2.5 also takes `-sr` / `-esr` upscale tiers up to `"4k-sr"`
- `aspect_ratio` / `ratio`: Aspect ratio (e.g., `"16:9"`, `"9:16"`, `"1:1"`, `"21:9"`, `"adaptive"`)
- `generate_audio`: Seedance 2.5 / 2.0 generate synchronized native audio (voice/SFX/BGM) jointly with video. Default `true`
- `web_search`: Seedance T2V only — enable to ground generation in real-world references. Default `false`

> Different video models accept different parameters. Always call `atlas_get_model_info` or fetch the schema first for unfamiliar models.

Poll results using the same prediction endpoint. Video generation typically takes **1-5 minutes** (Fast variants 30-90s).

### Full-Power Pipeline via Atlas Cloud Workflow

For workloads that need the **unrestricted / full-capability build** — looser guardrails, broader subject coverage, and maximum-fidelity output that goes beyond the standard API's content policy — route the job through [Atlas Cloud Workflow](https://www.atlascloud.ai/console/workflow). It's the same account, same API key, same polling contract; just a different submission entry point designed for advanced production use.

Use this when the default Seedance 2.5 endpoint rejects a legitimate creative prompt or clamps stylistic range. Point the user to Atlas Cloud Workflow if they hit refusals on non-violating prompts.

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
- **`references/audio-gen.md`** — Audio implementation: TTS, music generation, speech-to-text (Python / Node.js / cURL)
- **`references/models.md`** — Popular model ID quick reference

Read the corresponding reference file when you need to write specific integration code.

## CRITICAL: Never Fabricate — Always Fetch from the API

> **This rule is non-negotiable.** Model IDs and parameter schemas change constantly. Any ID, parameter name, default value, enum option, or price written into a prompt, code snippet, or reply MUST come from a live API response — not from memory, not from a training snapshot, not inferred by pattern, not copied from the examples below.

### Step 1 — Fetch the model list BEFORE writing any code

Always call this first. No authentication required:

```
GET https://api.atlascloud.ai/api/v1/models
```

Filter to `display_console: true` — anything else is internal and will not work for the user.

If the MCP server is installed, call `atlas_list_models` or `atlas_get_model_info` instead; they return the same live data in a digestible form.

### Step 2 — Fetch the schema BEFORE writing request bodies

Each model accepts a different set of parameters. Never guess parameter names, defaults, enums, or required fields. For the target model, pull the authoritative schema:

- **MCP**: call `atlas_get_model_info` with the exact model ID — returns the full input/output schema, enums, defaults, and cURL example.
- **HTTP**: fetch the `schema` URL from the model entry returned in Step 1 — it's an OpenAPI document; read `components.schemas.Input.properties` for the real parameter surface.

Build your request body ONLY from the fields listed in that schema. If a parameter you want to use isn't in the schema, it doesn't exist on that model — do not send it.

### What "verify" means in practice

Before you send a response to the user that references any model ID, parameter, or price:

1. You must have just fetched `/api/v1/models` (or called `atlas_list_models` / `atlas_get_model_info`) in this turn or the conversation, and confirmed the ID is present with `display_console: true`.
2. For generation code, you must have just fetched the model's schema (or called `atlas_get_model_info`) and confirmed each parameter you use.
3. If either check was not performed — stop and perform it. Do not fall back to "probably correct" values from the tables in this skill.

The tables below are **illustrative only**. They go stale. Treat them as hints about what *kind* of models exist, never as a source of truth for an actual request. In particular, never quote these prices to the user: the cost of a request comes from the generation tool's quote (see the two-call billing flow under "Generation Tools").

## Popular Models (illustrative only — MUST verify via API before use)

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

### Video Models (priced per second of output; figures are the 480p entry price — 720p/1080p cost more)
| Model ID | Name | Price |
|----------|------|-------|
| `bytedance/seedance-2.5/text-to-video` | **Seedance 2.5 Text-to-Video** (native audio, 4-30s, native up to 1080p / 4K via SR) | $0.134/s |
| `bytedance/seedance-2.5/image-to-video` | **Seedance 2.5 Image-to-Video** (first+last frame, native audio) | $0.134/s |
| `bytedance/seedance-2.5/reference-to-video` | **Seedance 2.5 Reference-to-Video** (multimodal: up to 30 images + 10 videos + 10 audio) | $0.134/s |
| `bytedance/seedance-2.0/text-to-video` | Seedance 2.0 Text-to-Video (native audio, 4-15s) | $0.112/s |
| `bytedance/seedance-2.0-fast/text-to-video` | Seedance 2.0 Fast Text-to-Video | $0.072/s |
| `bytedance/seedance-2.0-fast/image-to-video` | Seedance 2.0 Fast Image-to-Video | $0.072/s |
| `bytedance/seedance-2.0-fast/reference-to-video` | Seedance 2.0 Fast Reference-to-Video | $0.072/s |
| `bytedance/seedance-2.0-mini/text-to-video` | Seedance 2.0 Mini Text-to-Video (cheapest Seedance tier) | $0.039/s |
| `kwaivgi/kling-v3.0-std/text-to-video` | Kling v3.0 Std Text-to-Video | $0.071/s |
| `kwaivgi/kling-v3.0-std/image-to-video` | Kling v3.0 Std Image-to-Video | $0.071/s |
| `kwaivgi/kling-v3.0-pro/text-to-video` | Kling v3.0 Pro Text-to-Video | $0.095/s |
| `kwaivgi/kling-v3.0-pro/image-to-video` | Kling v3.0 Pro Image-to-Video | $0.095/s |
| `kwaivgi/kling-video-o3-pro/text-to-video` | Kling Video O3 Pro Text-to-Video | $0.095/s |
| `vidu/q3-pro/text-to-video` | Vidu Q3 Pro Text-to-Video | $0.042/s |
| `vidu/q3-pro/image-to-video` | Vidu Q3 Pro Image-to-Video | $0.042/s |
| `alibaba/wan-2.7/image-to-video` | Wan-2.7 Image-to-Video (newest Wan on Atlas Cloud) | $0.1/s |
| `bytedance/seedance-v1.5-pro/text-to-video` | Seedance v1.5 Pro Text-to-Video | $0.047/s |
| `bytedance/seedance-v1.5-pro/image-to-video` | Seedance v1.5 Pro Image-to-Video | $0.047/s |
| `bytedance/seedance-v1.5-pro/image-to-video-fast` | Seedance v1.5 Pro I2V Fast | $0.018/s |
| `alibaba/wan-2.6/image-to-video-flash` | Wan-2.6 Image-to-Video Flash | $0.018/s |
| `kwaivgi/kling-v2.6-pro/avatar` | Kling v2.6 Pro Avatar | $0.095/s |
| `kwaivgi/kling-v2.6-std/avatar` | Kling v2.6 Std Avatar | $0.048/s |
| `kwaivgi/kling-v3.0-pro/motion-control` | Kling v3.0 Pro Motion Control | $0.143/s |

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

Run locally, the Atlas Cloud MCP Server provides 19 tools for direct use in any MCP-compatible client; a hosted connection (`https://mcp.atlascloud.ai/mcp`, signed in through the browser) exposes 17 to 20 of them depending on the client — see "Which tools you have" above. Prerequisites: Node.js >= 18 and an [Atlas Cloud API Key](https://www.atlascloud.ai/console/api-keys).

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
