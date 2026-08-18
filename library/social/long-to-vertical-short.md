# Long Video → Vertical Short

> Landscape clip → reframed 9:16 short ready for TikTok / Reels / Shorts.

**Category:** social · **Difficulty:** Intermediate · **~Time:** 10 min

## What you'll make

A platform-ready 9:16 vertical short cut from a wide 16:9 source clip, with the subject re-centered and optional AI-generated B-roll or an animated cover frame. Use this when you have one landscape recording (a talk, demo, or interview) and need a punchy mobile-first edit for short-form feeds.

## Models used

- 💬 **LLM** — Claude (turn the transcript into hook + on-screen caption beats)
- 🎨 **Image** — Nano Banana Pro (resolve live; e.g. `google/nano-banana-pro/text-to-image`) for the 9:16 cover frame
- 🎬 **Video** — Seedance 2.5 i2v (resolve live; e.g. `bytedance/seedance-2.5/image-to-video`) or Kling 3 i2v (`kwaivgi/kling-v3.0-pro/image-to-video`) for animated cover / B-roll

## Steps

1. **Reframe to 9:16** — Ask the agent to crop/pan the source to vertical, keeping the speaker centered. This is a local ffmpeg/edit step (e.g. `crop=ih*9/16:ih`), not a model call — the AI models below add the cover and B-roll.
2. **Write the hook + captions** — "From this transcript, give me a 4-word hook and 6 short on-screen caption beats." → `atlas_chat` with **Claude**.
3. **Generate a 9:16 cover frame** — "Make a bold vertical cover, 9:16, big legible headline reading '<hook>'." → `atlas_generate_image` with **Nano Banana Pro**.
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls the live aspect-ratio / size schema.
4. **Animate the cover or add B-roll** — "Add a slow push-in to this cover for a 3s intro." → `atlas_generate_video` with **Seedance 2.5 i2v** (use `seedance-2.0-fast` for drafts). For richer motion, see the **Photo → Stylized Animated Clip** (`style-animate`) motion recipe.
5. **Assemble** — concatenate intro cover clip → reframed body → end card locally.

## Prompt starters

```
Hook (Claude): "Summarize this transcript into a 4-word curiosity hook + 6 caption beats (≤7 words each), punchy, no hashtags."
Cover (Nano Banana Pro): "Vertical 9:16 social cover, bold sans headline 'YOU'RE DOING THIS WRONG', high-contrast, mobile-safe margins, subject left, copy space right."
Cover animation (Seedance 2.5 i2v): "Subtle 3-second push-in on this cover, gentle parallax, no text distortion."
```

## Tips & variations

- Swap **Seedance 2.5 i2v** for **Kling 3 i2v** when you want stronger, more dramatic camera motion on the cover.
- Keep all generated frames at a true 9:16 ratio (e.g. 1080×1920) so nothing gets letterboxed in-feed.
- Draft with Seedance `seedance-2.0-fast` to preview pacing cheaply, then re-render the final cover at full quality.
- Batch it: feed the LLM several transcript chunks at once to get multiple hook options, then pick the strongest before generating.

## Related

- More recipes in [the library »](../README.md)
