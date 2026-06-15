# Compose Multiple Images Into One Scene

> 2–9 reference images → one unified, believable composite scene.

**Category:** edit · **Difficulty:** Advanced · **~Time:** 5 min

## What you'll make

Merge several inputs — a person, a product, a location, a style reference — into a
single coherent image where lighting, scale, and perspective all agree. Use it to
place your subject in a new setting, build a group shot from separate portraits,
or stage a product in a curated scene.

## Models used

- 🎨 **Image** — Seedream 4.5 (sequential) (resolve live; e.g. `bytedance/seedream-v4.5/sequential`)
- 🎨 **Image (alt)** — Nano Banana Pro (multi-ref edit) (resolve live; e.g. `google/nano-banana-pro/edit`)
- 💬 **LLM** — Claude (to write the composition / staging brief), optional

## Steps

1. **Upload every reference** — "Upload each of these local images and list their URLs." → maps to `atlas_upload_media` once per file; collect all `download_url`s.
2. **(Optional) Draft a staging brief** — "Write a one-paragraph scene brief placing the subject from image 1 into the location from image 2." → maps to `atlas_chat` with **Claude**.
3. **Compose** — "Combine these references into one scene: keep the person from ref A, the product from ref B, place them in the setting from ref C, match lighting and scale." → maps to `atlas_generate_image` with **Seedream 4.5 (sequential)**, passing the uploaded URLs as the reference/input images.
   > Tip: ask the agent to `atlas_search_docs` for the model first — the multi-image input field name and the max number of refs vary by model, so pull the live schema.
4. **Unify** — if the composite looks pasted, re-run asking for "a single consistent light source, matched color temperature, and correct relative scale."

## Prompt starters

```
Compose one photorealistic scene from the references: the woman from image 1,
wearing the jacket from image 2, standing in the cafe from image 3. Match a
single warm light source, consistent perspective, and realistic relative scale.
```
```
Place the product from image 1 onto the marble countertop from image 2 in the
style/mood of image 3. Unified lighting, accurate reflections, one cohesive shot.
```

## Tips & variations

- **Seedream 4.5 (sequential)** is built for multi-reference composition; **Nano Banana Pro (edit)** is a strong multi-ref alt with excellent subject consistency.
- Number your refs in the prompt ("image 1", "image 2") and state each one's *role* — it dramatically improves which element the model keeps from where.
- Fewer, cleaner refs beat many noisy ones. Crop each input to just the element you want before uploading.

## Related

- More recipes in [the library »](../README.md)
