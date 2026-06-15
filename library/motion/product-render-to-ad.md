# Product Render → 30-Second Ad

> Product image → short, punchy product ad clip.

**Category:** motion · **Difficulty:** Intermediate · **~Time:** 12 min

## What you'll make

A short (5–10s) advertising clip that animates a single product still into a polished hero spot — camera push-in, slow rotation, light sweep, and a clean reveal. Use it for paid social, a landing-page hero loop, or a marketplace listing video. Stitch two or three clips for a full 30-second cut.

## Models used

- 🎬 **Video** — Kling 3 image-to-video (resolve live; e.g. `kwaivgi/kling-v3.0-pro/image-to-video`)
- 🎬 **Video (drafts)** — Seedance 2 image-to-video (resolve live; e.g. `bytedance/seedance-2.0/image-to-video`); use the `-fast` variant first
- 🎨 **Image** — Seedream 4.5 (resolve live; e.g. `bytedance/seedream-v4.5`), only if you need a cleaner hero still first
- 💬 **LLM** — Claude, for ad copy / shot-by-shot prompt expansion (optional)

## Steps

1. **Get a clean hero still** — if your product photo is messy, generate one with the [E-commerce Product Hero Shot](../visual/ecommerce-hero.md) recipe first.
2. **Upload the still** — ask the agent to upload your local product image so it becomes a URL → maps to `atlas_upload_media`.
3. **Draft the motion** — "Animate this product shot: slow 15° turntable, soft light sweep left to right, shallow depth of field, 5 seconds." → maps to `atlas_generate_video` with **Seedance 2** (`-fast` for the cheap draft pass).
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls the live schema (duration, aspect ratio, resolution params change per model).
4. **Final render** — re-run the approved prompt on **Kling 3 image-to-video** for the crisp, high-fidelity version.
5. **Assemble** — generate 2–3 angles, then ask the agent for an ffmpeg concat command + a text overlay for your tagline.

## Prompt starters

```
Animate this product image into a premium ad shot. Camera slowly pushes in
and orbits 15 degrees around the product. A soft key light sweeps across the
surface revealing texture. Background stays clean and out of focus. 5 seconds,
9:16, photoreal, no text, no warping of the product shape.
```
```
Hero reveal: product sits on a reflective surface in darkness, then a beam of
light snaps on and the camera tilts up to reveal it. Subtle particles in the
air. Cinematic, glossy, commercial-grade. 6 seconds, 16:9.
```

## Tips & variations

- Lock the product shape: add "do not deform, reshape, or relabel the product" to every prompt — i2v models can warp logos and text.
- Cost vs quality: draft every angle on **Seedance 2 `-fast`** (cheapest), then spend the render budget only on the keeper via **Kling 3**.
- Want spoken VO or whoosh SFX baked in? Render the final on **Veo 3.1 image-to-video** (native audio) instead of Kling.

## Related

- More recipes in [the library »](../README.md)
