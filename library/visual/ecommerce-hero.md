# E-commerce Product Hero Shot

> Product description or a rough photo → a clean, studio-grade hero image ready for a PDP or ad.

**Category:** visual · **Difficulty:** Beginner · **~Time:** 6 min

## What you'll make

A crisp, well-lit product hero on a clean or styled background — the kind of shot that headlines a product detail page, an ad, or a marketplace listing. Works from a text description alone, or from a phone photo you want to upgrade into studio quality.

## Models used

- 🎨 **Image** — Seedream 4.5 (resolve live; e.g. `bytedance/seedream-v4.5`)
- 🎨 **Image (alt)** — Imagen 4 (clean photoreal; resolve live; e.g. `google/imagen4`)
- 💬 **LLM** — Claude or GPT (to turn a spec into a tight visual prompt), optional

## Steps

1. **(Optional) Upload your product photo** — if you have a real shot to base it on, ask the agent to upload it → maps to `atlas_upload_media`, returns an `image_url`.
2. **Tighten the brief** — ask the agent to expand your product spec into a hero-shot prompt (surface, lighting, angle, background) → maps to `atlas_chat`.
3. **Render the hero** — ask for a 1:1 or 4:5 studio shot, soft shadow, seamless background → maps to `atlas_generate_image` with Seedream 4.5 (pass `image_url` if you uploaded one).
4. **Pick & polish** — generate 2–3 angles, choose the winner, ask for a tighter crop variant.
   > Tip: ask the agent to `atlas_search_docs` for "seedream 4.5" first so it pulls the live schema and exact size/edit field names.

## Prompt starters

```
Studio product hero, 4:5. A matte-black wireless earbud charging case floating
slightly above a seamless light-grey backdrop, soft top-left key light, subtle
contact shadow, faint rim highlight on the edges. Ultra-clean, premium tech
catalog look, no text, no props, sharp focus on the product.
```

```
E-commerce hero, 1:1. A glass jar of amber honey on a sunlit marble counter,
a wooden dipper resting beside it, a few drips catching the light, soft
out-of-focus kitchen background. Warm, appetizing, premium grocery aesthetic, clean composition.
```

## Tips & variations

- Have a real product photo? Upload it and use Seedream 4.5 edit (or Nano Banana 2 edit) to swap the background and relight instead of generating from scratch — keeps the exact product.
- Want pure white-background marketplace shots? Imagen 4 nails clean, neutral studio lighting; ask for "pure #FFFFFF seamless, e-commerce packshot".
- Cost/speed: draft with `-fast` / lite tiers, then re-render the winner at full quality.

## Related

- More recipes in [the library »](../README.md)
