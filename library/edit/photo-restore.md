# Restore & Enhance Old Photo

> A damaged / faded photo → a clean, sharp, restored image.

**Category:** edit · **Difficulty:** Intermediate · **~Time:** 4 min

## What you'll make

Bring an old or low-quality photo back to life: remove scratches, creases, and
dust, fix fading, recover detail in faces, and (optionally) upscale to a crisp,
print-ready resolution. Perfect for family archives, heritage scans, and
rescuing the only copy of a precious shot.

## Models used

- 🎨 **Image** — Nano Banana 2 (edit) (resolve live; e.g. `google/nano-banana-2/edit`)
- 🎨 **Image (alt)** — Seedream 4.5 (edit) (resolve live; e.g. `bytedance/seedream-v4.5/edit`)
- 💬 **LLM** — Claude (to itemize the defects to fix), optional

## Steps

1. **Upload the scan** — "Upload this scanned old photo and give me the URL." → maps to `atlas_upload_media`; keep the `download_url`.
2. **Restore** — "Repair scratches, tears, and fading, recover facial detail, and clean up noise. Keep the original composition and likeness." → maps to `atlas_generate_image` with **Nano Banana 2 (edit)**, passing the uploaded URL as the input image.
   > Tip: ask the agent to `atlas_search_docs` for the model first to confirm the live edit schema and the largest supported output size for an upscale pass.
3. **Upscale / sharpen** — re-run on the restored result requesting a larger, sharper render (a dedicated upscale model may exist — have the agent `atlas_list_models` / `atlas_search_docs` for "upscale" and pick the live one).
4. **(Optional) Colorize** — for black-and-white, add "colorize naturally with period-accurate, realistic tones."

## Prompt starters

```
Restore this old photograph: remove scratches, creases, dust, and stains;
fix fading and contrast; sharpen and recover detail in the faces. Preserve
the exact composition, expressions, and likeness. Natural, non-plastic skin.
```
```
Colorize this black-and-white portrait with realistic, period-accurate tones.
Keep every facial feature and the original framing unchanged.
```

## Tips & variations

- Keep restoration and upscaling as **two passes** — restore first, then enlarge — for sharper, more controllable results.
- **Nano Banana 2 (edit)** is strong on faces; try **Seedream 4.5 (edit)** if you need heavier reconstruction of missing corners or torn regions.
- Tell the model to "preserve likeness, do not beautify" so restored faces still look like the real person.

## Related

- More recipes in [the library »](../README.md)
