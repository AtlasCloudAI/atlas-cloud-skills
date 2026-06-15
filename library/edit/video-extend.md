# Extend a Short Clip

> A ~5s clip → a longer, seamlessly continued video.

**Category:** edit · **Difficulty:** Intermediate · **~Time:** 5 min

## What you'll make

Take a short generated or filmed clip and extend it forward in time so the motion,
subject, and style continue without a visible seam. Use it to turn a 5-second
draft into something long enough for a social post, or to add breathing room
before a cut.

## Models used

- 🎬 **Video** — Wan (video-extend) (resolve live; e.g. `alibaba/wan-2.5/video-extend`)
- 🎬 **Video (alt)** — Kling 3 (i2v from last frame) (resolve live; e.g. `kwaivgi/kling-v3.0-pro/image-to-video`)
- 💬 **LLM** — Claude (to describe how the action should continue), optional

## Steps

1. **Upload the source clip** — "Upload this local video and return the URL." → maps to `atlas_upload_media`; keep the `download_url`.
2. **Describe the continuation** — say what happens next and that motion/style must stay continuous. Keep the camera and pacing consistent with the source.
3. **Extend** — "Continue this clip for another few seconds, keeping the same subject, motion, and style." → maps to `atlas_generate_video` with **Wan (video-extend)**, passing the uploaded clip URL.
   > Tip: ask the agent to `atlas_search_docs` for the video-extend model first — the input-video field, max added duration, and resolution constraints are model-specific, so pull the live schema.
4. **Poll & stitch** — the agent submits then polls via `atlas_get_prediction` until the extended clip is ready; chain another extend pass on the new tail for longer runs.

## Prompt starters

```
Continue this clip seamlessly: the camera keeps its slow dolly-in, the subject
keeps walking forward at the same pace, same lighting and color grade. No cut.
```
```
Extend the shot — the waves keep rolling in and the sun sinks slightly lower.
Maintain the existing motion direction, speed, and cinematic color.
```

## Tips & variations

- No native extend for your clip? Fall back to **Kling 3 (i2v)**: extract the last frame and animate it forward, then concatenate — have the agent `atlas_search_docs` for the live i2v schema.
- Each extension can drift slightly; keep the continuation prompt tight ("same subject, same motion, no cut") and stop after 1–2 passes for best coherence.
- Match the source's resolution and aspect ratio in the request so the seam is invisible.

## Related

- More recipes in [the library »](../README.md)
