# 3-Slide Story Ad Set

> A campaign brief → a 3-slide vertical Story ad set (3 images + 5s clips each).

**Category:** social · **Difficulty:** Advanced · **~Time:** 15 min

## What you'll make

A complete 9:16 Story / Reels ad sequence: three on-brand slides (hook → value → CTA), each as a still and an animated 5-second clip, sized for Instagram/Facebook Stories, TikTok, and Xiaohongshu. Use this to ship a full launch-ready ad set from a single brief.

## Models used

- 💬 **LLM** — Claude (expand the brief into a 3-beat story script + per-slide copy)
- 🎨 **Image** — Seedream 4.5 (resolve live; e.g. `bytedance/seedream-v4.5`, sequential: `bytedance/seedream-v4.5/sequential`) for a consistent 3-slide look
- 🎬 **Video** — Seedance 2 i2v (resolve live; e.g. `bytedance/seedance-2.0/image-to-video`)

## Steps

1. **Script the 3 beats** — "From this brief, write a 3-slide Story ad: slide 1 hook, slide 2 value/proof, slide 3 CTA. Give headline + subline per slide." → `atlas_chat` with **Claude**.
2. **Generate 3 consistent stills** — "3 matching 9:16 Story slides, same brand palette and layout, texts: [per slide]." → `atlas_generate_image` with **Seedream 4.5 sequential** so all three share one style.
   > Tip: ask the agent to `atlas_search_docs` for Seedream first to confirm the live 9:16 ratio and how many frames sequential returns.
3. **Animate each slide** — "Animate this Story slide: gentle motion + text reveal, 5s, 9:16." → `atlas_generate_video` with **Seedance 2 i2v** (one call per slide; `-fast` for drafts).
4. **Add motion polish** — for a stronger CTA slide, see the **Photo → Stylized Animated Clip** (`style-animate`) motion recipe.
5. **Assemble** — sequence the three 5s clips hook → value → CTA, add captions and a brand end-frame.

## Prompt starters

```
Script (Claude): "Brief: [PASTE]. Write a 3-slide vertical Story ad — slide 1 hook (≤6 words), slide 2 value + one proof point, slide 3 CTA. Headline + subline each, cohesive voice."
Stills (Seedream sequential): "3 matching 9:16 Story slides, modern gradient brand style, bold sans headlines. Slide 1 'STOP SCROLLING', slide 2 'HERE'S WHY', slide 3 'TRY IT FREE'. Mobile-safe margins."
Animation (Seedance 2 i2v): "Animate this 9:16 slide: subtle background drift + a clean headline reveal, energetic but smooth, 5 seconds."
```

## Tips & variations

- **Seedream 4.5 sequential** is the key to a unified set — it keeps palette and layout consistent across all three slides; reach for **Nano Banana Pro** if a slide needs heavier typography.
- For dramatic CTA motion, swap **Seedance 2 i2v** for **Kling 3 i2v** (`kwaivgi/kling-v3.0-pro/image-to-video`).
- Keep every asset true 9:16 (1080×1920) and all key copy inside Story-safe margins so the UI doesn't cover it.
- Draft all three animations with Seedance `-fast` to lock pacing, then re-render finals at full quality.

## Related

- More recipes in [the library »](../README.md)
