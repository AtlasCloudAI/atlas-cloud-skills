# Portrait + Script → Talking Avatar

> A portrait photo + a script → a lip-synced talking-head clip.

**Category:** motion · **Difficulty:** Intermediate · **~Time:** 12 min

## What you'll make

A talking-head video where a still portrait speaks your script with synced lips and natural head motion. Use it for a spokesperson clip, a course intro, a product explainer, an avatar host, or a faceless-channel presenter. Input is one portrait plus the words you want said.

## Models used

- 🎬 **Video (avatar)** — Kling avatar (resolve live; e.g. `kwaivgi/kling-v2.6-pro/avatar`)
- 🎬 **Video (alt)** — Hailuo 02 image-to-video (resolve live; e.g. `minimax/hailuo-02/i2v-pro`)
- 🎨 **Image** — Nano Banana Pro (resolve live), only if you need to generate the portrait first
- 💬 **LLM** — Claude, to tighten the script to a target duration

## Steps

1. **Get a clean portrait** — front-facing, well-lit, mouth visible. Need one? Generate it with **Nano Banana Pro** via `atlas_generate_image`, or use the [Character Reference Sheet](../visual/character-sheet.md) recipe.
2. **Upload the portrait** — ask the agent to upload it so it becomes a URL → maps to `atlas_upload_media`.
3. **Tighten the script** — "Trim this to ~20 seconds of natural spoken English, conversational tone." → maps to `atlas_chat` with **Claude**.
4. **Generate the talking clip** — provide the portrait URL + the script (and a voice/audio if the schema asks for one) → maps to `atlas_generate_video` with **Kling avatar**.
   > Tip: ask the agent to `atlas_search_docs` for the avatar model first — it has specific fields for the audio/voice and the driving image; these vary by model and change over time.
5. **Frame & caption** — ask the agent for an ffmpeg crop to 9:16 and burned-in subtitles for silent autoplay.

## Prompt starters

```
Driving portrait: [uploaded URL]. Have the person say, warmly and clearly:
"Hey — welcome back. Today I'll show you the three settings that make the
biggest difference. Let's jump in." Natural head movement and blinks, eyes to
camera, neutral studio background.
```
```
Spokesperson read, confident and upbeat: "Introducing the new Atlas — faster,
lighter, and built for teams. Try it free today." Subtle nods on emphasis,
friendly expression.
```

## Tips & variations

- For longer monologues or a wider range of head motion, try **Hailuo 02** as the alt path.
- Keep the source portrait neutral-mouthed and forward-facing — extreme angles or open mouths hurt sync.
- Bring your own voice: record/clone the audio elsewhere and pass it in if the model accepts an audio input, rather than relying on text-to-speech.

## Related

- More recipes in [the library »](../README.md)
