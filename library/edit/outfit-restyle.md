# Outfit & Style Restyle

> A portrait → the same person in a new outfit, era, or aesthetic.

**Category:** edit · **Difficulty:** Intermediate · **~Time:** 4 min

## What you'll make

Restyle the wardrobe and overall look of a person in a photo while keeping their
face and identity intact — swap a hoodie for a tailored suit, try a streetwear or
'90s look, or recolor an outfit to match a brand palette. Great for lookbooks,
profile refreshes, and fashion mood exploration.

## Models used

- 🎨 **Image** — Seedream 4.5 (edit) (resolve live; e.g. `bytedance/seedream-v4.5/edit`)
- 🎨 **Image (alt)** — Qwen Image (edit) (resolve live; e.g. `alibaba/qwen-image/edit-plus`)
- 💬 **LLM** — Claude (to translate a vibe into concrete garment details), optional

## Steps

1. **Upload the portrait** — "Upload this portrait and return the URL." → maps to `atlas_upload_media`; keep the `download_url`.
2. **(Optional) Turn a vibe into specifics** — "Describe an 'old-money autumn' outfit: garments, fabrics, colors." → maps to `atlas_chat` with **Claude**.
3. **Restyle the outfit** — "Change the clothing to [outfit], keep the face, hairstyle, pose, and background unchanged." → maps to `atlas_generate_image` with **Seedream 4.5 (edit)**, passing the uploaded URL as the input image.
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls the live edit schema and identity-preservation guidance.
4. **Lock identity** — if the face drifts, re-run with "preserve the exact same face and skin tone; only change the clothing."

## Prompt starters

```
Restyle the outfit into a tailored charcoal three-piece suit with a white
shirt and silk tie. Keep the person's face, hairstyle, pose, and the studio
background exactly the same. Realistic fabric folds and lighting.
```
```
Change the clothing to 1990s streetwear: oversized graphic tee, baggy jeans,
windbreaker. Same face and body proportions, same background.
```

## Tips & variations

- **Seedream 4.5 (edit)** holds identity well on full-body restyles; **Qwen Image (edit)** is a strong alt for fabric texture and color-accurate brand palettes.
- Changing only color? Say "recolor the jacket to forest green, keep the cut and texture" — far cleaner than re-describing the whole garment.
- Want several looks at once? Reuse the one uploaded URL across multiple outfit prompts.

## Related

- More recipes in [the library »](../README.md)
