# Trending Meme Image or Clip

> A meme idea → a shareable meme image or short meme clip with on-image text.

**Category:** social · **Difficulty:** Beginner · **~Time:** 6 min

## What you'll make

A square (1:1) or vertical (9:16) meme — either a still with crisp top/bottom caption text, or a 3–5s animated meme clip. Use this to react to a trend fast, where speed and legible text matter more than polish.

## Models used

- 💬 **LLM** — Claude (riff a brief into several caption/punchline options)
- 🎨 **Image** — GPT Image 2 (resolve live) — best for sharp, correctly-spelled in-image text
- 🎬 **Video** — Seedance 2.5 (resolve live; e.g. `bytedance/seedance-2.5/text-to-video`, or i2v `bytedance/seedance-2.5/image-to-video`) for the animated version

## Steps

1. **Brainstorm captions** — "Give me 8 meme captions for <situation>, varied formats: top/bottom, one-liner, fake-headline." → `atlas_chat` with **Claude**.
2. **Generate the meme still** — "Meme image, 1:1, bold Impact-style top text '<line A>' and bottom text '<line B>', clean and legible." → `atlas_generate_image` with **GPT Image 2**.
   > Tip: ask the agent to `atlas_search_docs` for GPT Image 2 first — it renders typography best when the exact caption text is in the prompt and quoted.
3. **(Optional) Animate it** — "Add a 3s zoom-and-shake meme motion to this image, keep the text static." → `atlas_generate_video` with **Seedance 2.5** i2v (`seedance-2.0-fast` is plenty for memes).
4. **Export** — drop to 1:1 for the feed or 9:16 for Stories/Shorts.

## Prompt starters

```
Captions (Claude): "8 meme captions about [SITUATION]. Mix top/bottom two-liners and single punchlines. Keep each ≤10 words, internet-native voice."
Still (GPT Image 2): "Square 1:1 meme. Top text: 'WHEN THE BUILD PASSES'. Bottom text: 'FIRST TRY'. Bold white Impact font, black outline, expressive subject, high contrast."
Clip (Seedance 2.5): "Meme motion: quick punch-in zoom with a tiny camera shake on the subject, text overlay stays perfectly still, 3 seconds."
```

## Tips & variations

- For the still, **GPT Image 2** and **Ideogram V3** are the safest for clean spelling; **Nano Banana Pro** also handles text well if you want a different look.
- For a pure text-to-video meme (no source still), use **Seedance 2.5** t2v directly and describe the gag in one line.
- Keep captions short — long text shrinks and gets unreadable on mobile.
- Generate the still at both 1:1 and 9:16 in one batch so you can post the same joke everywhere.

## Related

- More recipes in [the library »](../README.md)
