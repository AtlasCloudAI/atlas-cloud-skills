# Nano Banana 2 From Your Terminal

> A text prompt → a generated image, the cheapest/fastest way, straight from your shell.

**Category:** visual · **Difficulty:** Beginner · **~Time:** 1 min

## What you'll make

A single, high-quality image generated in one command. Nano Banana 2 is Google's fast, low-cost image model on Atlas Cloud — a great default when you want a solid render in seconds without fiddling with parameters. Ideal for quick drafts, batch ideation, and scripting image generation into your own tools.

## Models used

- 🎨 **Image** — Nano Banana 2 (resolve live; e.g. `google/nano-banana-2/text-to-image`)
- 🎨 **Edit variant** — Nano Banana 2 Edit (resolve live; e.g. `google/nano-banana-2/edit`)

## Steps

1. **One-liner via the Atlas Cloud CLI** — the fastest path; submit and poll in one go:
   ```bash
   atlas generate image google/nano-banana-2/text-to-image -p "your prompt here"
   ```
2. **Or via the Skill** — ask your agent: *"Generate an image with Nano Banana 2: &lt;your prompt&gt;"* → maps to `atlas_quick_generate` with `model_keyword="nano banana 2"`, `type="Image"`, or to `atlas_generate_image` with the resolved model ID.
   > Tip: ask the agent to `atlas_search_docs` for "nano banana 2" first so it pulls the live model ID and schema (size / aspect field names change). Set `ATLASCLOUD_API_KEY` in your shell before running the CLI.

## Prompt starters

```
atlas generate image google/nano-banana-2/text-to-image \
  -p "A cozy reading nook by a rainy window, warm lamp light, a cat curled on a
      knit blanket, steam rising from a mug, soft bokeh, cinematic, photoreal, 3:4"
```

```
atlas generate image google/nano-banana-2/text-to-image \
  -p "Isometric 3D illustration of a tiny floating island with a waterfall and a
      windmill, pastel palette, clean studio lighting, game-art style, transparent
      background feel, 1:1"
```

## Tips & variations

- Why Nano Banana 2: it's the cheap/fast tier — perfect for iterating on many prompt ideas before committing to a pricier, higher-fidelity render. Step up to Nano Banana Pro when you need maximum detail or stronger text rendering.
- Editing instead of generating? Use the Nano Banana 2 Edit model and pass your source image (upload a local file first via `atlas_upload_media` to get a URL).
- Scripting a batch? Loop the CLI over a list of prompts and collect the output URLs.

## Related

- More recipes in [the library »](../README.md)
