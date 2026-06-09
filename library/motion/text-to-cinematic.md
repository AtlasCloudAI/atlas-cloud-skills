# Text → Cinematic Establishing Shot

> One line of description → a cinematic establishing shot with a camera move.

**Category:** motion · **Difficulty:** Beginner · **~Time:** 8 min

## What you'll make

A single, gorgeous establishing shot generated straight from text — a sweeping drone-style reveal, a slow dolly through a location, or a hero pan across a landscape. Use it as an opener for a film, a B-roll bed, a title-card background, or a mood piece. No source image needed; this is pure text-to-video.

## Models used

- 🎬 **Video** — Veo 3.1 text-to-video (resolve live; e.g. `google/veo3.1/text-to-video`), native audio
- 🎬 **Video (alt)** — Sora 2 text-to-video (resolve live; e.g. `openai/sora-2/text-to-video`)
- 🎬 **Video (drafts)** — Seedance 2 text-to-video `-fast` (resolve live; cheapest, for framing)
- 💬 **LLM** — Claude, to expand one line into a rich, camera-aware shot prompt

## Steps

1. **Expand the line** — "Turn 'a lighthouse at dawn' into a detailed cinematic shot prompt with camera move, lens, light, and mood." → maps to `atlas_chat` with **Claude**.
2. **Draft the framing** — run the expanded prompt cheaply first → maps to `atlas_generate_video` with **Seedance 2 t2v** (`-fast`).
   > Tip: ask the agent to `atlas_search_docs` for the model first so it pulls live duration, resolution, and aspect-ratio params.
3. **Final render** — re-run the keeper on **Veo 3.1 text-to-video** for fidelity *and* native audio (ambient sound baked in), or **Sora 2** for its motion/physics feel.
4. **Grade & loop (optional)** — ask the agent for an ffmpeg color tweak or a clean loop point.

## Prompt starters

```
A lone lighthouse on a rocky cliff at first light. Camera flies low over the
water then rises and arcs around the lighthouse as the beam sweeps. Golden-hour
haze, long lens, cinematic 2.39:1, gentle wind and surf ambience. 6 seconds.
```
```
Slow dolly forward down an empty neon-lit Tokyo alley at night, rain on the
pavement reflecting signs, steam rising from a vent. Anamorphic flares, shallow
depth of field, moody. 8 seconds, 16:9, ambient city + rain sound.
```

## Tips & variations

- Pick **Veo 3.1** when you want sound for free; pick **Sora 2** for complex motion and physical realism.
- Always name the camera move ("dolly in", "crane up", "orbit") — vague prompts give static shots.
- Need this to continue into a longer take? Hand the clip to the [Extend a Short Clip](../edit/video-extend.md) recipe.

## Related

- More recipes in [the library »](../README.md)
