# Background Swap / Replace

> A photo → the same subject dropped onto a brand-new background.

**Category:** edit · **Difficulty:** Beginner · **~Time:** 3 min

## What you'll make

Keep your subject (a person, product, or pet) exactly as-is while swapping the
background for something new — a studio sweep, a beach, a gradient, or a branded
set. Use it to rescue a great photo shot against a messy room, or to mass-produce
on-brand variants of one hero shot.

## Models used

- 🎨 **Image** — Nano Banana 2 (edit) (resolve live; e.g. `google/nano-banana-2/edit`)
- 🎨 **Image (alt)** — Seedream 4.5 (edit) (resolve live; e.g. `bytedance/seedream-v4.5/edit`)
- 💬 **LLM** — Claude (to describe the new background richly), optional

## Steps

1. **Upload the source photo** — "Upload this local photo so it has a URL." → maps to `atlas_upload_media`; keep the returned `download_url`.
2. **(Optional) Expand the background prompt** — "Describe a warm sunset beach background in one vivid sentence." → maps to `atlas_chat` with **Claude**.
3. **Swap the background** — "Replace the background with [scene], keep the subject, pose, and lighting on the subject unchanged." → maps to `atlas_generate_image` with **Nano Banana 2 (edit)**, passing the uploaded URL as the input image.
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls the live edit schema (input-image field name, supported sizes).
4. **Review & iterate** — if edges look cut-out, re-run asking for "matched ambient lighting and a soft contact shadow under the subject."

## Prompt starters

```
Replace the background with a clean seamless studio sweep in soft beige.
Keep the person, their pose, hair, and clothing exactly the same. Match the
lighting on the subject to the new background and add a subtle contact shadow.
```
```
Swap the background to a sunlit tropical beach at golden hour, gentle bokeh.
Do not alter the product itself — preserve its shape, label, and reflections.
```

## Tips & variations

- Swap **Nano Banana 2 (edit)** → **Seedream 4.5 (edit)** for stronger relighting and photoreal contact shadows.
- For hard-edged products (bottles, boxes), explicitly say "preserve label text and edges" to stop the model from redrawing them.
- Generating many variants? Loop the same uploaded URL with different background prompts — upload once, reuse the URL.

## Related

- More recipes in [the library »](../README.md)
