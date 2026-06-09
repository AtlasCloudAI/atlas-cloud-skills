# Logo → 3D Figurine Reveal

> Flat logo → turntable clip of it as a collectible 3D figurine.

**Category:** motion · **Difficulty:** Intermediate · **~Time:** 12 min

## What you'll make

A short reveal clip where your flat 2D logo becomes a glossy, toy-like 3D figurine spinning on a turntable. Great for brand teasers, merch drops, Discord/Telegram stickers, or a playful "we made it real" social post. Two stages: turn the logo into a figurine *still*, then animate the turntable.

## Models used

- 🎨 **Image (edit)** — Nano Banana Pro edit (resolve live; e.g. `google/nano-banana-pro/edit`)
- 🎬 **Video** — Kling effects (resolve live; e.g. `kwaivgi/kling-effects`)
- 🎬 **Video (alt)** — Seedance 2 image-to-video (resolve live; e.g. `bytedance/seedance-2.0/image-to-video`); `-fast` for drafts
- 💬 **LLM** — Claude, for material / lighting prompt ideas (optional)

## Steps

1. **Upload the logo** — ask the agent to upload your logo file so it becomes a URL → maps to `atlas_upload_media`. (Need a logo first? Run the [Brand Logo & Wordmark Concepts](../visual/brand-logo-concepts.md) recipe.)
2. **Make the figurine still** — "Turn this logo into a collectible vinyl figurine on a round base, studio lighting, on a desk, packaging blister behind it." → maps to `atlas_generate_image` (edit) with **Nano Banana Pro**.
   > Tip: ask the agent to `atlas_search_docs` for the edit model first so it pulls the live input-image field name and size options.
3. **Upload the figurine still** — same `atlas_upload_media` step on the new render.
4. **Animate the turntable** — drive a clean 360° spin → maps to `atlas_generate_video`. Try **Kling effects** for a ready-made reveal, or **Seedance 2 i2v** (`-fast` draft → full render) for a custom orbit.
5. **Polish** — ask the agent for an ffmpeg loop (seamless start/end) and an optional logo lockup card at the end.

## Prompt starters

```
Edit: convert this logo into a cute collectible 3D vinyl figurine standing on a
glossy round base. Soft studio key light, subtle rim light, shallow depth of
field, on a wooden desk. Keep the logo's colors and silhouette recognizable.
```
```
Animate: the figurine rotates a smooth, continuous 360 degrees on its turntable
base. Camera locked, soft light sweep across the surface as it turns. 5 seconds,
seamless loop, no text, do not warp the shape.
```

## Tips & variations

- For a "born from light" reveal, prompt: "starts as the flat 2D logo, then extrudes and materializes into the 3D figurine" on **Seedance 2 i2v**.
- Material swaps are one prompt away: try "frosted translucent resin", "die-cast metal", or "plush toy".
- Keep the spin slow (≤30°/s) — fast rotation makes logo text smear.

## Related

- More recipes in [the library »](../README.md)
