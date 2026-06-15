# Xiaohongshu / RED Cover

> Topic or idea → a scroll-stopping vertical cover image with a bold headline.

**Category:** visual · **Difficulty:** Beginner · **~Time:** 5 min

## What you'll make

A 3:4 vertical cover sized for Xiaohongshu (RED) feeds, with a strong focal image and crisp, on-image Chinese or English headline text. Use it as the first card of a note to win the tap in a crowded feed.

## Models used

- 🎨 **Image** — Nano Banana Pro (resolve live; e.g. `google/nano-banana-pro/text-to-image`)
- 🎨 **Image (typography pass)** — GPT Image 2 (great at clean text-in-image; resolve live)
- 💬 **LLM** — Claude or Qwen (for hook-y headline + prompt expansion), optional

## Steps

1. **Brainstorm the hook** — ask the agent to turn your topic into 3 punchy headline options (≤12 chars CN / ≤6 words EN) → maps to `atlas_chat` with Claude or Qwen.
2. **Render the base cover** — ask for a 3:4 image with the scene, color mood, and headline baked in → maps to `atlas_generate_image` with Nano Banana Pro.
3. **Fix the typography (if needed)** — if the headline rendered messy, ask the agent to regenerate just the text layout cleanly → maps to `atlas_generate_image` with GPT Image 2.
   > Tip: ask the agent to `atlas_search_docs` for "nano banana pro" first so it pulls the live schema (aspect ratio / size field names differ per model).

## Prompt starters

```
Xiaohongshu cover, 3:4 vertical. Cozy flat-lay of a matcha latte and an open
notebook on a cream linen table, soft window light, pastel palette. Large bold
headline top-third reading "3个早八续命神器", clean rounded sans-serif, high
contrast, leave breathing room around the text. Trendy, minimal, lifestyle-blog aesthetic.
```

```
Vertical 3:4 beauty cover, glossy close-up of a dewy-skin model holding a serum
bottle, peachy gradient background, magazine lighting. Headline "油皮亲妈"
in chunky white type with a thin coral outline, centered. Aesthetic, clickable, RED-style.
```

## Tips & variations

- Headline rendering off? Swap to GPT Image 2 or Ideogram V3 — both are stronger at exact text. Keep the headline short; long strings are where models break.
- Need a 5-card carousel from one look? Reuse the scene prompt and ask for sequential variants with Seedream 4.5 sequential.
- Cost/speed: Nano Banana 2 is the cheaper, faster sibling for quick drafts before a final Pro render.

## Related

- More recipes in [the library »](../README.md)
