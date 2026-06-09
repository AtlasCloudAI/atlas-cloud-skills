# YouTube Thumbnail A/B Pack

> A video topic → 3 distinct 16:9 thumbnail variants to A/B test.

**Category:** social · **Difficulty:** Intermediate · **~Time:** 9 min

## What you'll make

Three high-CTR 16:9 (1280×720) YouTube thumbnails for the same video, each taking a different angle — curiosity, emotion, and bold-claim — so you can split-test which drives the most clicks. Use this before publishing, or to refresh an underperforming video.

## Models used

- 💬 **LLM** — Claude (generate 3 distinct thumbnail concepts + the 2–4 word overlay text for each)
- 🎨 **Image** — Nano Banana Pro (resolve live; e.g. `google/nano-banana-pro/text-to-image`) and Flux 2 (resolve live; e.g. `flux2/flex`)

## Steps

1. **Generate 3 angles** — "For a video titled '<title>', give me 3 thumbnail concepts (curiosity / emotion / bold-claim), each with a 2–4 word overlay and a visual direction." → `atlas_chat` with **Claude**.
2. **Render variant A & B** — "16:9 YouTube thumbnail, shocked face left, huge text '<overlay>' right, saturated colors, thick outline." → `atlas_generate_image` with **Nano Banana Pro**.
   > Tip: ask the agent to `atlas_search_docs` for the model first to confirm the live 16:9 / size parameter before rendering.
3. **Render variant C** — run the third concept through **Flux 2** for a different rendering aesthetic, so your A/B set isn't visually samey.
4. **Check legibility** — view each at small size; the text must read on a phone. Regenerate any that look cluttered.
5. **Export the pack** — three 1280×720 PNGs, labeled A/B/C for your test.

## Prompt starters

```
Concepts (Claude): "Video: '[TITLE]'. Give 3 thumbnail concepts — (1) curiosity gap, (2) emotional reaction, (3) bold claim. For each: a 2–4 word overlay + one-sentence visual."
Variant (Nano Banana Pro): "16:9 YouTube thumbnail, close-up shocked expression on the left third, bold yellow text 'I WAS WRONG' on the right, high saturation, strong rim light, thick black text outline."
Variant (Flux 2): "16:9 thumbnail, dramatic before/after split composition, punchy contrast, large minimal caption 'BEFORE → AFTER', cinematic lighting."
```

## Tips & variations

- **Nano Banana Pro** and **GPT Image 2** are strongest for legible overlay text; **Flux 2** gives a richer photographic look — mixing them keeps the A/B variants genuinely different.
- Always render true 16:9 (1280×720) so YouTube doesn't crop your text.
- Push contrast and keep overlay text to ≤4 words — small-size legibility wins clicks.
- Batch a 4th "control" variant cheaply and let real CTR data pick the winner.

## Related

- More recipes in [the library »](../README.md)
