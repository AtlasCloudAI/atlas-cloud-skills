# Brand Logo & Wordmark Concepts

> A short brand brief → a set of logo & wordmark concept directions to choose from.

**Category:** visual · **Difficulty:** Intermediate · **~Time:** 8 min

## What you'll make

A spread of logo concepts — wordmarks, a lettermark/monogram, and a simple icon mark — in a consistent style, so you can pick a direction before handing off to a designer for vectorizing. Best for early ideation and moodboarding, not final production artwork.

## Models used

- 🎨 **Image** — Ideogram V3 (best-in-class text rendering; resolve live)
- 🎨 **Image (alt)** — GPT Image 2 (clean typography & layout; resolve live)
- 💬 **LLM** — Claude or GPT (brief → naming/style directions), optional

## Steps

1. **Frame the brief** — ask the agent to distill your brand into 3 directions (personality, palette, type feel) → maps to `atlas_chat`.
2. **Generate wordmark concepts** — ask for the brand name set as clean wordmarks on a plain background, several styles → maps to `atlas_generate_image` with Ideogram V3.
3. **Generate an icon / monogram** — ask for a simple, flat, single-color mark that pairs with the wordmark → maps to `atlas_generate_image` with Ideogram V3 or GPT Image 2.
4. **Lay out a concept board** — ask for a tidy grid showing the marks on light and dark.
   > Tip: ask the agent to `atlas_search_docs` for "ideogram" first so it pulls the live schema and the exact spelling/seed controls for crisp lettering.

## Prompt starters

```
Logo concept sheet on a plain off-white background. Wordmark for a specialty
coffee brand named "NORTHBOUND" — modern geometric sans-serif, tight letter
spacing, warm terracotta color. Show 3 variations: all-caps wordmark, a stacked
two-line lockup, and a single-letter "N" monogram in a rounded square. Flat
vector style, clean, no mockups, no extra text.
```

```
Minimal logo for a fintech app called "Ledgr". Lowercase friendly sans-serif
wordmark in deep navy, paired with a simple abstract icon suggesting an upward
ledger line. Single accent color (mint green). Flat, scalable, balanced. Present
the wordmark and the standalone icon side by side on white.
```

## Tips & variations

- Exact spelling matters for logos — Ideogram V3 and GPT Image 2 are the most reliable at rendering the literal brand name. Keep names short and re-roll if a letter is wrong.
- Want it on merch? Take the chosen mark into an edit model (Nano Banana 2 edit) to mock it onto a tote, cap, or storefront.
- These are concepts, not vectors — hand the winning direction to a designer (or a vectorizer) for production files.

## Related

- More recipes in [the library »](../README.md)
