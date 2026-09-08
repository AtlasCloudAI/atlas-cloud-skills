---
name: atlas-3d-model-skill
description: >-
  Generate downloadable 3D assets through Atlas Cloud from either a text prompt
  or one object image. Use for 3D model generation, text-to-3D, image-to-3D,
  GLB, OBJ, USDZ, FBX, STL, Seed3D, Hunyuan 3D, Atlas 3D, 3D模型生成,
  文生3D, 图生3D, and turning a product or character image into a mesh.
---

# Atlas 3D Model Skill

Turn a short text brief or one clean object image into a verified local 3D
asset through Atlas Cloud. Prefer the bundled runner because it performs live
model/schema checks, preserves prediction IDs, downloads the result, extracts
Seed3D archives safely, and validates the model file.

For a Chinese request, read
[the Chinese workflow](references/workflow.zh-CN.md) before execution. Keep
model IDs, JSON keys, commands, and file-format names unchanged.

## Route the request

| Input | Default live route | Default result | Best for |
|---|---|---|---|
| Text only | `tencent/hunyuan3d-rapid/text-to-3d` | `GLB` | Fast concept assets and prompt-only requests |
| Local image or image URL | `bytedance/seed3d-v2.0/image-to-3d` | `glb` inside a ZIP | Textured, PBR-shaded assets reconstructed from one view |

These IDs are defaults, not permanent facts. Before every billable submission,
the runner must find the exact model in the live Atlas catalog with
`display_console: true`, fetch its current schema, validate every parameter,
and read its current price. Never invent a model ID, parameter, enum, or price.

Choose the text route when the user supplied only a description. Choose the
image route whenever a usable object image is present. Do not silently generate
an intermediate image for a text request; that adds cost and can change the
shape. If the user explicitly wants Seed3D from text, first create and inspect a
clean reference image, then run the image route as a separate paid step.

## Prepare the input

### Text-to-3D

Write one object-centric prompt, at most the live schema limit. Include:

1. the subject and silhouette;
2. the main materials and colours;
3. important structural parts;
4. a neutral, complete-object presentation;
5. intended use only when it changes topology, such as game-ready or printable.

Avoid camera moves, scene action, long backgrounds, and several unrelated
objects. A useful pattern is:

```text
A single stylized desk robot, rounded rectangular body, two articulated arms,
matte ivory shell with orange joints, complete object, centered, clean topology.
```

### Image-to-3D

Use one sharp image showing the complete object with minimal occlusion. Prefer
a plain or transparent background, even lighting, and a three-quarter view.
Avoid collages, turntable sheets, cropped parts, text overlays, heavy shadows,
and multiple objects. The bundled runner accepts a local PNG, JPEG, WebP, or BMP
and uploads it to Atlas automatically without exposing the API key.

Follow the live image constraints. At the time of execution the schema, not this
file, is authoritative for size, dimensions, aspect ratio, and formats.

## Execute

Resolve the directory containing this `SKILL.md` and invoke its runner with an
absolute path. Node.js 18 or newer is required. `unzip` is required for Seed3D
archives.

First perform a free dry run. It fetches the live catalog and schema, reports
the exact price and request body, and does not upload or submit anything:

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --prompt "A single stylized desk robot, matte ivory shell, orange joints" \
  --output-dir ./outputs/desk-robot \
  --dry-run
```

Then make one billable request after the price is within the user's stated
budget. The process needs `ATLASCLOUD_API_KEY` (or the compatibility alias
`ATLAS_CLOUD_API_KEY`) in its environment. Never print, persist, or ask the user
to paste the key into chat.

Text-to-3D:

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --prompt "A single stylized desk robot, matte ivory shell, orange joints" \
  --format GLB \
  --pbr \
  --output-dir ./outputs/desk-robot
```

Image-to-3D:

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --image ./robot.png \
  --format glb \
  --subdivision medium \
  --output-dir ./outputs/desk-robot-image
```

Remote image:

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --image-url https://example.com/robot.png \
  --output-dir ./outputs/desk-robot-url
```

The default per-request safety ceiling is `$1`. Use `--max-cost` only after
reporting the live cost and obtaining any approval required by the user. Never
automatically retry the generation `POST`; a lost response may still represent
a billable task.

## Resume instead of regenerating

The runner writes `job.json` immediately after a successful submission and
prints the prediction ID. If local polling expires or a later download fails,
resume that task:

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --resume PREDICTION_ID \
  --format GLB \
  --output-dir ./outputs/desk-robot
```

Do not submit a replacement while the original prediction is non-terminal or
its status is unknown. A new submission is a new charge.

## Deliver and verify

A successful run must contain:

- the local 3D model path;
- `job.json` with the prediction ID and recovery command inputs;
- `generation.json` with model, route, status, live catalog price, output size,
  and validation result;
- a local thumbnail when Atlas returns one.

Report the actual route, model ID, requested format, prediction ID, live price,
local file size, and validation result. Link or attach the local model artifact
when the host supports it. Do not call a task complete merely because submission
succeeded; it is complete only after a terminal success, download, and format
validation.

For GLB, the runner checks the `glTF` magic, version, and declared byte length.
For ZIP-based formats it tests the archive. Other supported formats receive a
format-specific signature or structural sanity check. A preview image does not
prove that the 3D file is valid.

## Failure policy

- `401`: stop and refresh the protected API-key configuration.
- `402`: stop and report insufficient balance; do not resubmit.
- `404` during early polling: try the documented result endpoint; preserve the
  prediction ID.
- `429` or `5xx` on generation `POST`: do not retry automatically.
- polling timeout: resume the same prediction ID later.
- completed without a 3D output: report the response summary and prediction ID;
  do not treat a thumbnail as the model.
- invalid downloaded file: preserve the original download and manifest for
  diagnosis; do not submit a replacement without an explicit retry decision.

## Direct MCP fallback

When the Atlas Cloud MCP tools are available, they may be used instead of the
runner:

1. call `atlas_list_models` with `type="Image"` or `atlas_search_docs` for 3D;
2. call `atlas_get_model_info` for the exact selected model;
3. for a local image, call `atlas_upload_media`;
4. submit once with `atlas_generate_image` because Atlas classifies 3D models
   as Image-type generation;
5. poll the same ID with `atlas_get_prediction` until terminal;
6. download, extract when needed, and validate the actual 3D file.

The MCP fallback does not remove the delivery and validation requirements.
