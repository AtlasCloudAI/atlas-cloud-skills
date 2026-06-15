# Character Sheet → Multi-Shot AI Drama

> Character reference sheet → multi-shot scene with a consistent character.

**Category:** motion · **Difficulty:** Advanced · **~Time:** 20 min

## What you'll make

A short, multi-shot dramatic scene (3–5 clips) starring the *same* character across angles and beats — wide establishing shot, medium two-shot, close-up reaction. Use it for an AI short film, a webtoon-style episode, or a story-driven ad. Character consistency is the whole game here, which is why we drive it from a reference sheet.

## Models used

- 🎬 **Video** — Seedance 2 reference-to-video (resolve live; e.g. `bytedance/seedance-2.0/reference-to-video`)
- 🎬 **Video (drafts)** — Seedance 2 reference-to-video `-fast` variant (cheapest, for blocking shots)
- 🎨 **Image** — Seedream 4.5 sequential / Nano Banana Pro (resolve live), for the source sheet
- 💬 **LLM** — Claude, to break a logline into a shot list + per-shot prompts

## Steps

1. **Build the character sheet** — run the [Character Reference Sheet](../visual/character-sheet.md) recipe to get multi-pose, multi-expression reference images of your character.
2. **Upload the references** — ask the agent to upload the sheet (or your best 1–3 frames) so they become URLs → maps to `atlas_upload_media`.
3. **Write the shot list** — "Turn this logline into 4 shots with camera, blocking, and emotion for each." → maps to `atlas_chat` with **Claude**.
4. **Block each shot cheaply** — feed the reference + a shot prompt → maps to `atlas_generate_video` with **Seedance 2 reference-to-video** (`-fast` first).
   > Tip: ask the agent to `atlas_search_docs` for the model first — reference-to-video expects specific reference-image fields and counts.
5. **Final render + assemble** — re-run keepers at full quality, then ask for an ffmpeg concat in story order with simple cuts.

## Prompt starters

```
Use the attached character references. Shot 1, wide establishing: she stands
at the edge of a rain-soaked rooftop at night, city lights below, coat moving
in the wind. Slow push-in. Keep her face, hair, and outfit exactly as the
reference. 5 seconds, cinematic, 2.39:1.
```
```
Use the attached character references. Shot 3, close-up: same woman, a single
tear, eyes flick up as thunder cracks. Handheld micro-movement, shallow focus.
Match the reference identity precisely. 4 seconds.
```

## Tips & variations

- Repeat the phrase "keep face, hair, and wardrobe identical to the reference" in every shot — drift compounds across clips.
- Keep lighting and lens language consistent shot-to-shot (same color grade, same focal feel) so cuts don't jar.
- For dialogue beats, hand the close-ups to a lip-sync pass with the [Talking Avatar](./talking-avatar.md) recipe.

## Related

- More recipes in [the library »](../README.md)
