# Quote / Announcement Card Carousel

> A block of text → a cohesive multi-card carousel (quotes, tips, or an announcement).

**Category:** social · **Difficulty:** Beginner · **~Time:** 8 min

## What you'll make

A set of 3–8 visually consistent cards (typically 1:1 or 4:5 for Instagram, or 3:4 vertical for Xiaohongshu) that read as one swipeable carousel — a quote series, a "5 tips" list, or a product announcement. Use this when the message is text-first and brand consistency across slides matters.

## Models used

- 💬 **LLM** — Claude (split a long brief into per-card headlines + body copy)
- 🎨 **Image** — GPT Image 2 (resolve live) for crisp typographic cards; Seedream 4.5 sequential (resolve live; e.g. `bytedance/seedream-v4.5/sequential`) for a style-consistent multi-card set

## Steps

1. **Slice the content** — "Turn this paragraph into a 6-card carousel: a cover + 4 point cards + a CTA card; give headline + 1 short line each." → `atlas_chat` with **Claude**.
2. **Lock a card style** — decide palette, font vibe, and ratio (e.g. 4:5 portrait) so every slide matches.
3. **Generate the cards as a set** — "Generate 6 matching carousel cards, 4:5, same color system and layout, text per card: [list]." → `atlas_generate_image` with **Seedream 4.5 sequential** for consistency, or run each card through **GPT Image 2** for the sharpest text.
   > Tip: ask the agent to `atlas_search_docs` for Seedream sequential first to confirm how many frames/cards it returns and the live ratio options.
4. **QA the text** — verify spelling on every card; regenerate any slide whose copy rendered wrong.
5. **Order & export** — arrange cover → points → CTA in carousel order.

## Prompt starters

```
Copy (Claude): "Split this into a 6-slide carousel: slide 1 cover hook, slides 2–5 one tip each (headline + ≤12-word line), slide 6 CTA. Consistent tone."
Set (Seedream sequential): "6-card carousel, 4:5, minimalist editorial style, cream background, charcoal serif headlines. Card texts: 1) 'Ship Faster' 2) ... 6) 'Follow for more'."
Single card (GPT Image 2): "4:5 quote card, large serif headline 'Done is better than perfect', small attribution bottom-left, generous margins, soft paper texture."
```

## Tips & variations

- **Seedream 4.5 sequential** keeps layout/palette consistent across cards in one shot; **GPT Image 2** or **Ideogram V3** win when exact typography is critical — many creators do the cover in GPT Image 2 and the body cards in Seedream.
- For a matching scroll-stopping cover, see the **Xiaohongshu / RED Cover** (`xiaohongshu-cover`) visual recipe.
- Keep one accent color and one font family across all slides — consistency is what makes it read as a carousel.

## Related

- More recipes in [the library »](../README.md)
