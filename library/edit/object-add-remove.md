# Add or Remove Objects

> A photo → a clean edit with an object seamlessly added or removed.

**Category:** edit · **Difficulty:** Beginner · **~Time:** 3 min

## What you'll make

Targeted, instruction-driven edits to a single photo: delete a photobomber, erase
a logo or wire, or add a prop that wasn't there. The model fills the gap with
plausible texture and lighting so the result looks like the original shot, not a
patch job.

## Models used

- 🎨 **Image** — Flux Kontext (edit) (resolve live; e.g. `black-forest-labs/flux-kontext-dev`)
- 🎨 **Image (alt)** — Nano Banana 2 (edit) (resolve live; e.g. `google/nano-banana-2/edit`)
- 💬 **LLM** — Claude (to phrase precise edit instructions), optional

## Steps

1. **Upload the source photo** — "Upload this image and give me the URL." → maps to `atlas_upload_media`; keep the `download_url`.
2. **Write a precise instruction** — describe exactly what to add or remove and what must stay untouched. Flux Kontext follows localized edit instructions well.
3. **Run the edit** — "Remove the [object] and reconstruct the background behind it." → maps to `atlas_generate_image` with **Flux Kontext (edit)**, passing the uploaded URL as the input image.
   > Tip: ask the agent to `atlas_search_docs` for Flux Kontext first to confirm the live input-image field and any guidance/strength params.
4. **Refine in passes** — chain edits one change at a time (remove first, then add) for cleaner, more controllable results than one mega-prompt.

## Prompt starters

```
Remove the person standing in the background on the right. Reconstruct the
brick wall and sidewalk naturally behind them. Keep everything else identical.
```
```
Add a steaming cup of coffee on the wooden table next to the laptop, with
soft morning light and a realistic shadow. Do not change the laptop or hands.
```

## Tips & variations

- **Flux Kontext** excels at "keep everything else the same" localized edits; switch to **Nano Banana 2 (edit)** when an add needs richer scene reasoning or relighting.
- Removing large objects? Expect the model to invent what's behind — add "reconstruct plausibly" and re-roll if the fill looks off.
- One change per run. Stacking "remove X and add Y and recolor Z" in a single prompt lowers fidelity.

## Related

- More recipes in [the library »](../README.md)
