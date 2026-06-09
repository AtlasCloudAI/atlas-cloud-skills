# App UI / Landing Hero Mockup

> A product brief → a polished app UI / landing-page hero mockup for a pitch or concept.

**Category:** visual · **Difficulty:** Intermediate · **~Time:** 8 min

## What you'll make

A clean hero visual for an app or SaaS landing page — a device frame or browser window showing a believable UI, with a headline, subhead, and CTA. Perfect for pitch decks, concept explorations, and early marketing mockups (not a production design file).

## Models used

- 🎨 **Image** — GPT Image 2 (best for legible UI text & layout; resolve live)
- 🎨 **Image (alt)** — Flux 2 (rich, photoreal device/scene renders; resolve live; e.g. `flux2/flex`)
- 💬 **LLM** — Claude or GPT (brief → headline, subhead, UI section list), optional

## Steps

1. **Shape the message** — ask the agent to turn your brief into a hero headline, subhead, CTA label, and the key UI elements to show → maps to `atlas_chat`.
2. **Render the UI hero** — ask for the app/landing hero on-device with that copy, in a chosen aesthetic → maps to `atlas_generate_image` with GPT Image 2 (keeps text crisp).
3. **(Optional) Scene it** — ask Flux 2 for a photoreal version (device on a desk, soft studio light) for a more premium marketing look → maps to `atlas_generate_image` with Flux 2.
   > Tip: ask the agent to `atlas_search_docs` for "gpt image" first so it pulls the live schema and the correct size / aspect parameter.

## Prompt starters

```
Landing-page hero mockup, 16:9. Clean modern SaaS dashboard shown inside a
floating browser window on a soft gradient (indigo → white) background. Left side:
big headline "Ship faster, ship calmer", subhead "The project tracker your team
actually opens", and a rounded primary button labeled "Start free". Right side:
the browser window showing a tidy dashboard with a sidebar, a chart card, and a
task list. Crisp UI typography, generous whitespace, light theme, product-launch quality.
```

```
Mobile app hero, 4:5. A modern iPhone-style frame floating over a peachy gradient,
showing a fitness app home screen: a circular daily-progress ring, three stat
cards, and a green "Start workout" button. Bold headline above the phone: "Your
strongest year starts today." Clean, friendly, App-Store-feature aesthetic, soft shadow.
```

## Tips & variations

- UI text is the hard part — GPT Image 2 (or Ideogram V3) keeps button labels and headlines legible; Flux 2 wins on photoreal device/scene but can muddy small text, so let GPT Image 2 own the copy.
- Need dark mode + light mode? Reuse the prompt, just flip the theme line.
- Want the hero animated for the deck? Take it into Kling 3 / Seedance 2 image-to-video for a subtle 5s loop.

## Related

- More recipes in [the library »](../README.md)
