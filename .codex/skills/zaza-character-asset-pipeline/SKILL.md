---
name: zaza-character-asset-pipeline
description: Generate and normalize Zaza Fighter character art, girl sprites, feet-check closeups, and portrait expression strips. Use when Codex is working on Zaza Fighter assets, Soi Six or Walking Street girls, high-definition one-character sprite generation, image/photo-based character references, feet modeling, portrait animation, chroma-key source sheets, or fixing choppy/low-res/mispacked game strips.
---

# Zaza Character Asset Pipeline

## Core Rule

Never ship raw imagegen sheets directly as runtime animation.

Imagegen output is source material. Runtime assets must be cut, filtered, aligned, scaled, and repacked into exact slots with code. If a generated sheet crosses frame boundaries, has two rows inside a one-row strip, crops feet, changes character size, duplicates nearly identical frames, or warps anatomy, reject it or extract only the usable parts.

## Required Workflow

1. Use `game-studio:sprite-pipeline` and `imagegen` together.
2. Generate or select one adult character at a time.
3. Generate one asset family at a time: full-body action, portrait expressions, or feet-check closeups.
4. Use flat chroma key source art, usually `#00ff00`, with generous gutters and no shadows.
5. Inspect the source sheet at full resolution before processing.
6. Repack deterministic runtime strips with `scripts/pack_green_grid.py` or an equivalent project script.
7. Update registry metadata to the actual output dimensions and frame counts.
8. Run the project asset validator and build.
9. Browser-check the live game surface, especially feet-check overlay and Soi Six runner behavior.

## Generation Standards

- Adult-only, covered pin-up/swimwear/club styling; no nudity or explicit sex acts.
- For Soi Six girls, default to adult covered go-go microbikini / nightlife swimwear styling unless the user specifies a different outfit. This is a style and costume direction, not permission for nudity.
- One girl per generation. Do not create five girls on one sheet.
- One action per generation. Do not ask for idle, run, portrait, and feet in one image.
- High-definition source first. Prefer large source art and downpack later.
- Keep the same silhouette, outfit, hair, palette, heel style, and face identity across frames.
- Full-body sprites must include the entire body and shoes in every usable frame.
- Feet-check frames must keep both feet or the intended foot pose fully visible.
- Portrait strips must show actual painted expression changes: smile, shy smile, laugh, giggle, glance, relaxed return. Do not fake blush or pulse with CSS.
- Animation should read as pose, hold, return to idle, pose again. Avoid constant fast thrashing.

## Photo Or Picture References

When the user sends a photo or picture as a character reference:

1. Treat it as visual reference for a stylized fictional game character unless the user explicitly asks otherwise.
2. If the person appears young or age is unclear, do not sexualize the output; ask for adult confirmation if needed.
3. Preserve recognizable non-sensitive visual cues: hair, face shape, pose attitude, outfit palette, body proportions, accessories.
4. Convert the reference into the Zaza arcade sprite style on chroma key.
5. Build runtime strips from the generated source with deterministic packing.

Use a photo reference to generate a single approved seed first. Do not jump directly to a final runtime strip.

## Feet-Check Rule

The current good Soi Six feet-check closeups are the target quality reference. Preserve that level of glossy close-up rendering, coherent shoe identity, and readable foot pose when creating new feet assets.

Some feet closeups look amazing as illustrations but are still terrible game strips. A beautiful raw sheet is not enough.

Ship only after:

- every frame is in its own exact 512x512 slot,
- the subject does not cross slot boundaries,
- the feet are not cropped,
- pose scale and foot identity stay coherent,
- frames advance in a readable sequence,
- the overlay uses canvas/frame animation, not CSS scrolling.

If the model creates a 4x2 feet source image, repack selected cells into a one-row 512px strip. Do not use that raw 4x2 image as the strip.

If existing feet assets are already strong, do not replace them just to chase novelty. Use them as the reference and focus on the broken asset family, often portraits.

## Portrait Rule

Portrait animation must come from image frames, not CSS filters, overlays, pulse effects, or background-position drift.

Target:

- 640x720 per frame for the current feet-check overlay unless the project changes it.
- 8-12 frames.
- Face centered in every frame.
- No side-by-side duplicate profile, crossover face, or cropped head.
- FPS around 6-8 unless the user asks faster.

## Runtime Metadata

After processing assets, make registry data match actual files:

- `frames`
- `frameWidth`
- `frameHeight`
- `frameRate` or feet-check `fps`
- `render.scale`, `originX`, `originY`
- feet-check `faceFrames`, `faceFrameWidth`, `faceFrameHeight`, `faceFps`

Then run:

```bash
npm run validate:assets
npm run build
```

## References

- Prompt recipes: `references/prompt-recipes.md`
- Quality gates: `references/quality-gates.md`
- Deterministic green-sheet packer: `scripts/pack_green_grid.py`
