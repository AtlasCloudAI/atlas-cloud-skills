# Atlas Cloud Skills — Recipe Library

> Creative playbooks: **input → finished output**, the models to use, and the exact steps. Drive any of them with the [`atlas-cloud`](../atlas-cloud/SKILL.md) skill inside Claude Code, Codex, Gemini CLI, or any skill-compatible agent.

Each recipe names the models, the step sequence, and ready-to-paste prompt starters. Model IDs are always resolved live (via `atlas_search_docs` / `atlas_quick_generate`) so nothing goes stale.

Browse by what you're making:

## 🎨 Visual — image generation

| Recipe | Input → Output |
|--------|----------------|
| [Xiaohongshu / RED Cover](visual/xiaohongshu-cover.md) | topic → scroll-stopping 3:4 cover with a bold headline |
| [E-commerce Product Hero Shot](visual/ecommerce-hero.md) | product desc or photo → clean studio hero |
| [Cinematic Movie Poster](visual/cinematic-poster.md) | logline → dramatic key-art poster with title |
| [Brand Logo & Wordmark Concepts](visual/brand-logo-concepts.md) | brand brief → a board of logo directions |
| [Character Reference Sheet](visual/character-sheet.md) | character desc → consistent multi-pose sheet |
| [App UI / Landing Hero Mockup](visual/ui-hero-mockup.md) | product brief → polished UI hero mockup |
| [Nano Banana 2 From Your Terminal](visual/nano-banana-2-from-terminal.md) | prompt → an image, the cheapest & fastest way |

## 🎬 Motion — video generation

| Recipe | Input → Output |
|--------|----------------|
| [Product Render → 30-Second Ad](motion/product-render-to-ad.md) | product still → short ad clip |
| [Character Sheet → Multi-Shot AI Drama](motion/character-to-drama.md) | character sheet → consistent multi-shot scene |
| [Logo → 3D Figurine Reveal](motion/logo-to-3d-figurine.md) | logo → figurine turntable reveal |
| [Text → Cinematic Establishing Shot](motion/text-to-cinematic.md) | one line → cinematic shot with a camera move |
| [Portrait + Script → Talking Avatar](motion/talking-avatar.md) | photo + script → lip-synced avatar |
| [Photo → Stylized Animated Clip](motion/style-animate.md) | still → stylized motion clip |

## ✂️ Edit — image & video editing

| Recipe | Input → Output |
|--------|----------------|
| [Background Swap / Replace](edit/background-swap.md) | photo → new background, subject locked |
| [Add or Remove Objects](edit/object-add-remove.md) | photo → clean add/erase, one change per pass |
| [Outfit & Style Restyle](edit/outfit-restyle.md) | portrait → restyled look, identity locked |
| [Restore & Enhance Old Photo](edit/photo-restore.md) | damaged scan → restored + upscaled |
| [Compose Multiple Images Into One Scene](edit/multi-image-compose.md) | 2–9 refs → one unified scene |
| [Extend a Short Clip](edit/video-extend.md) | ~5s clip → longer continuous clip |

## 📱 Social — platform-ready formats

| Recipe | Input → Output |
|--------|----------------|
| [Long Video → Vertical Short](social/long-to-vertical-short.md) | landscape clip → 9:16 short |
| [Product Hero → UGC Unboxing Video](social/unboxing-ugc.md) | product image → handheld UGC clip |
| [Trending Meme Image or Clip](social/meme-clip.md) | idea → meme image / short |
| [Quote / Announcement Card Carousel](social/quote-card-carousel.md) | text → cohesive multi-card set |
| [YouTube Thumbnail A/B Pack](social/thumbnail-ab-pack.md) | topic → 3 A/B thumbnail variants |
| [3-Slide Story Ad Set](social/story-ad-set.md) | brief → 3 images + 5s clips |

---

**Contribute a recipe.** Have a workflow worth sharing? Open an issue with the `[Recipe]` template or send a PR adding a file under the matching `library/<category>/` folder — follow the structure of any existing recipe. New contributors get added to the acknowledgements.
