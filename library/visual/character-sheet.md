# Character Reference Sheet

> A character description → a consistent multi-pose / multi-expression reference sheet.

**Category:** visual · **Difficulty:** Intermediate · **~Time:** 10 min

## What you'll make

A turnaround-style character sheet: the same character rendered in multiple poses, angles, and expressions with consistent identity, outfit, and proportions. Use it as a reference for illustration, game/animation, or as the input to a reference-to-video drama (see motion/).

## Models used

- 🎨 **Image** — Seedream 4.5 sequential (consistent multi-image sets; resolve live; e.g. `bytedance/seedream-v4.5/sequential`)
- 🎨 **Image (alt)** — Nano Banana Pro (strong character consistency; resolve live; e.g. `google/nano-banana-pro/text-to-image`)
- 💬 **LLM** — Claude or GPT (description → detailed, locked character bible), optional

## Steps

1. **Lock the character bible** — ask the agent to expand your description into fixed details (face, hair, outfit, palette, proportions) you'll repeat verbatim → maps to `atlas_chat`.
2. **Generate the pose set** — ask for a sequential set: front / 3-4 / side / back turnaround, same character → maps to `atlas_generate_image` with Seedream 4.5 sequential.
3. **Generate an expression row** — ask for the same face across neutral / happy / angry / surprised → maps to `atlas_generate_image` with Seedream 4.5 sequential or Nano Banana Pro.
4. **Compose the sheet** — ask for the poses and expressions arranged on a clean neutral backdrop.
   > Tip: ask the agent to `atlas_search_docs` for "seedream 4.5 sequential" first so it pulls the live schema (how many frames, the sequence field names).

## Prompt starters

```
Character reference sheet, sequential set, consistent character across all frames.
A young cartographer girl, 20s, copper bob with a green headscarf, freckles, round
glasses, olive field jacket over a cream shirt, brown satchel. Render a full-body
turnaround: front view, three-quarter view, side profile, back view — same outfit,
same proportions, neutral T-pose-ish stance, soft even studio lighting, plain
light-grey background, semi-realistic illustration style.
```

```
Expression sheet for the same character (copper bob, green headscarf, round
glasses). Five head-and-shoulders portraits in a row: neutral, warm smile,
focused/squinting, surprised, frustrated. Keep face, hair, and glasses identical
across all five. Clean line-art-meets-paint style, plain background.
```

## Tips & variations

- Drift in identity between frames? Re-paste the exact character-bible string every time, and prefer sequential generation over separate one-off calls — it holds consistency far better.
- Nano Banana Pro multi-reference is a strong alternative when you already have one good portrait to anchor on.
- Feed the finished sheet into Seedance 2 reference-to-video to animate the character into a multi-shot scene.

## Related

- More recipes in [the library »](../README.md)
