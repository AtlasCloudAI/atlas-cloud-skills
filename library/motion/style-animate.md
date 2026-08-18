# Photo → Stylized Animated Clip

> A still photo → a short clip with a stylized, animated look.

**Category:** motion · **Difficulty:** Beginner · **~Time:** 8 min

## What you'll make

A short clip that brings one still to life *and* restyles it — anime, watercolor, claymation, pixel-art, oil-painting — with gentle, living motion (drifting hair, blinking, parallax, moving clouds). Use it for a stylized avatar loop, an album-cover animation, a moody social post, or a "living photo" effect.

## Models used

- 🎬 **Video** — Seedance 2.5 image-to-video (resolve live; e.g. `bytedance/seedance-2.5/image-to-video`); `seedance-2.0-fast` is cheapest for drafts
- 🎬 **Video (alt)** — Kling 3 image-to-video (resolve live; e.g. `kwaivgi/kling-v3.0-pro/image-to-video`)
- 🎨 **Image (edit, optional)** — Nano Banana Pro / Seedream 4.5 edit, to lock the style in the still first
- 💬 **LLM** — Claude, for style-direction prompt ideas (optional)

## Steps

1. **Upload the photo** — ask the agent to upload your still so it becomes a URL → maps to `atlas_upload_media`.
2. **(Optional) Pre-stylize the still** — if you want a strong art style, restyle the image first via the [Outfit & Style Restyle](../edit/outfit-restyle.md) recipe or a quick **Nano Banana Pro** edit, then re-upload.
3. **Draft the motion** — describe the style + the movement → maps to `atlas_generate_video` with **Seedance 2.5 i2v** (`seedance-2.0-fast` first).
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls the live motion-strength / duration / aspect-ratio params.
4. **Final render** — re-run the keeper at full quality on **Seedance 2.5** or **Kling 3** for smoother, cleaner motion.
5. **Loop it** — ask the agent for a seamless ffmpeg loop for autoplay.

## Prompt starters

```
Animate this photo in a soft Studio-Ghibli-style anime look. Hair and grass
drift in a light breeze, clouds move slowly, the subject blinks and breathes.
Keep the composition; gentle parallax only. 5 seconds, seamless loop.
```
```
Bring this portrait to life as a moving watercolor painting: visible brush
texture, colors gently bleeding, subtle head turn and a slow blink. Painterly,
dreamy, low motion. 4 seconds, 9:16.
```

## Tips & variations

- Keep motion *low* for "living photo" vibes — high motion strength breaks stylization and warps faces.
- Iterate the look on **Seedance 2.0 Fast** (cheapest) until the style holds, then render the final once.
- Want the style baked harder? Lock it in the still first (step 2) so the video model only has to add motion, not invent the style.

## Related

- More recipes in [the library »](../README.md)
