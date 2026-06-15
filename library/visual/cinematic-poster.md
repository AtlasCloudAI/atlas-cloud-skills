# Cinematic Movie Poster

> A one-line concept → dramatic, key-art movie poster with title treatment.

**Category:** visual · **Difficulty:** Intermediate · **~Time:** 8 min

## What you'll make

A theatrical key-art poster: a striking hero composition, cinematic lighting and color grade, and a bold title treatment with tagline and credits block. Great for a film/short pitch, a fictional poster, an event, or eye-catching campaign art.

## Models used

- 🎨 **Image** — Flux 2 (rich cinematic detail; resolve live; e.g. `flux2/flex`)
- 🎨 **Image (alt / title pass)** — Nano Banana Pro (resolve live; e.g. `google/nano-banana-pro/text-to-image`)
- 💬 **LLM** — Claude or GPT (logline → title, tagline, visual concept), optional

## Steps

1. **Develop the key art concept** — ask the agent to turn your logline into a poster concept: hero subject, mood, palette, title, tagline → maps to `atlas_chat`.
2. **Render the key art** — ask for a 2:3 poster, cinematic lighting and grade, composed with negative space for the title → maps to `atlas_generate_image` with Flux 2.
3. **Add the title treatment** — ask the agent to lay in the title + tagline + credits block cleanly → maps to `atlas_generate_image` with Nano Banana Pro (strong text), or describe the type directly in the Flux 2 prompt.
   > Tip: ask the agent to `atlas_search_docs` for "flux 2" first so it pulls the live schema and the correct aspect-ratio / size parameter.

## Prompt starters

```
Cinematic movie poster, 2:3, theatrical key art. A lone astronaut silhouetted
against a vast amber dust storm on Mars, low-angle hero shot, volumetric god rays,
teal-and-orange grade, film grain, anamorphic flare. Dramatic negative space at
the top for a title. Title at bottom in bold condensed serif: "THE LAST SIGNAL",
small tagline above it: "No one is coming." Credits block along the bottom edge.
```

```
Neo-noir thriller poster, 2:3. A detective in a rain-soaked trench coat under a
flickering neon sign, reflections on wet asphalt, deep shadows, cyan-and-magenta
palette, moody key light. Title across the lower third in distressed sans-serif:
"COLDWIRE". Cinematic, high contrast, premium one-sheet design.
```

## Tips & variations

- Title text looks off in Flux 2? Generate the art clean, then do a title-only pass with Nano Banana Pro or Ideogram V3 for sharp typography.
- Want a series (teaser + final)? Keep the hero and palette fixed, vary tagline and crop.
- Turn the poster into motion: feed it to a Kling 3 or Seedance 2 image-to-video step for a 5s animated teaser (see the motion/ recipes).

## Related

- More recipes in [the library »](../README.md)
