# Product Hero → UGC Unboxing Video

> Product image → handheld, authentic-feeling 9:16 UGC unboxing clip.

**Category:** social · **Difficulty:** Intermediate · **~Time:** 12 min

## What you'll make

A short, casual "creator holds and reveals the product" video in 9:16, styled to look like organic user-generated content rather than a polished studio ad. Use this for TikTok Shop, Reels, and Xiaohongshu seeding where a handheld, lived-in feel converts better than glossy commercials.

## Models used

- 💬 **LLM** — Claude (expand a one-line brief into 3 unboxing hooks + voiceover lines)
- 🎨 **Image** — Nano Banana Pro (resolve live; e.g. `google/nano-banana-pro/edit`) to place the product in a realistic hand/desk scene
- 🎬 **Video** — Seedance 2 i2v (resolve live; e.g. `bytedance/seedance-2.0/image-to-video`) or Kling 3 i2v (`kwaivgi/kling-v3.0-pro/image-to-video`)

## Steps

1. **Upload the product hero** — point the agent at your product photo. → `atlas_upload_media`.
2. **Write UGC hooks** — "Give me 3 first-person unboxing hooks + a 2-line voiceover for <product>, casual creator tone." → `atlas_chat` with **Claude**.
3. **Stage a realistic UGC frame** — "Place this product in a hand against a cozy bedroom desk, phone-camera look, 9:16." → `atlas_generate_image` (edit) with **Nano Banana Pro**.
   > Tip: ask the agent to `atlas_search_docs` for the edit model first to confirm the live image-input field name and aspect-ratio options.
4. **Animate the reveal** — "Animate a handheld unboxing: hands turn the product toward camera, slight wobble, 5s." → `atlas_generate_video` with **Seedance 2 i2v**.
5. **Caption + assemble** — burn in the hook from step 2 and a CTA end card locally.

## Prompt starters

```
Hooks (Claude): "Write 3 TikTok unboxing hooks (≤8 words) + a 2-line natural voiceover for [PRODUCT]. First person, hyped but believable."
Scene (Nano Banana Pro edit): "Put this product in a person's hand on a sunlit wooden desk, soft window light, slight phone-camera grain, vertical 9:16."
Reveal (Seedance 2 i2v): "Handheld unboxing motion: hands rotate the product toward the lens, natural micro-shake, shallow depth of field, 5 seconds."
```

## Tips & variations

- Use **Kling 3 i2v** when you need more lifelike hand articulation; use **Seedance 2 i2v** (`-fast`) for cheap pacing drafts.
- For a fuller branded spot from the same hero shot, follow the **Product Render → 30-Second Ad** (`product-render-to-ad`) motion recipe instead.
- Keep lighting slightly imperfect and add light grain — too-clean renders read as ads and lose the UGC trust signal.
- Generate 2–3 scene backgrounds (bedroom, café, car seat) and batch-animate to A/B which setting performs.

## Related

- More recipes in [the library »](../README.md)
