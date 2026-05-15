# Soi Six HD NPC Source Sheets - 2026-05-15

Generated with the built-in image generation path as high-detail source contact sheets. These are not runtime-wired assets. Do not add them to the generated manifest until the rows are chopped, keyed, normalized, and reviewed.

## Files

| Character | Personality | Source sheet | Source size | Intended rows |
| --- | --- | --- | --- | --- |
| Mintra | Electric door promoter, playful and fast | `soi-six-hd-mintra-source-v1-20260515.png` | 1774x887 | 12 run, 10 walk, 8 flirt/callout idle |
| Kanda | Cool VIP lounge queen, poised and teasing | `soi-six-hd-kanda-source-v1-20260515.png` | 1774x887 | 12 run, 10 walk, 8 flirt/callout idle |
| Dao | Sporty scooter-street promoter, cheeky and athletic | `soi-six-hd-dao-source-v1-20260515.png` | 1774x887 | 12 run, 10 walk, 8 flirt/callout idle |
| Ploy | Sharp street dancer/callout girl, bold and rhythmic | `soi-six-hd-ploy-source-v1-20260515.png` | 1751x898 | 12 run, 10 walk, 8 flirt/callout idle |

## Art Direction

- Adult Thai/Asian women only; all prompts specify late 20s or early 30s.
- Sexy Pattaya/Soi Six nightlife styling, but non-nude and non-explicit.
- No redheads. Hair is black or dark brown.
- One character per sheet, facing right, full-body, chroma-key `#00ff00`.
- Source sheets are intended for transparent-ready extraction, not direct runtime use.

## Chop And Normalization Plan

1. Make a preservation copy before edits.
2. Remove any non-uniform border/padding from the sheet while keeping the `#00ff00` background.
3. Split each sheet into three row working images by visual row:
   - Row 1: `run`, target 12 frames.
   - Row 2: `walk`, target 10 frames.
   - Row 3: `idle` or new ambient action alias, target 8 flirt/wave/callout frames.
4. For each row, prefer component-aware splitting over equal slicing when frame spacing drifts. The repo's `scripts/import-imagegen-sheet.py --split-mode components` pattern is the closest existing workflow.
5. Normalize every accepted frame to a 256x256 transparent PNG canvas:
   - Bottom-center foot contact anchor.
   - Consistent character height within a character and close to existing NPC scale.
   - Preserve full body; reject or repaint cropped feet/hands.
   - Remove `#00ff00` with chroma-key alpha, soft matte, and despill.
6. Export runtime strips only after visual QA:
   - `public/assets/generated/animations/<character-id>/run.png`: 12 frames, 3072x256.
   - `public/assets/generated/animations/<character-id>/walk.png`: 10 frames, 2560x256.
   - `public/assets/generated/animations/<character-id>/idle.png` or `callout.png`: 8 frames, 2048x256.
7. If wiring into current runtime without code changes, note that existing NPC contracts consume `idle`, `talk`, `walk`, `react`, `cheer`, and `panic`; `run` and `callout` need registry/runtime support before they will play.

## QA Notes

- Generated contact sheets often miss exact frame-count discipline. Treat the row counts as source intent and verify manually before import.
- Kanda should get extra review for lower-row padding/cropping before final normalization.
- Reject frames that are repeated stills, have outfit drift, change face identity, lose shoes/feet, or create impossible limb positions.
- For final sheets, prefer a single facing direction and rely on Phaser flip where appropriate.

## Exact Prompts

### Mintra

```text
Use case: stylized-concept
Asset type: high-definition source sprite sheet for a 2D arcade fighting game ambient NPC, to be chopped into transparent 256x256 runtime frames.
Primary request: Create a single clean sprite-sheet image for one adult Thai/Asian woman nightlife NPC named Mintra. She is clearly an adult in her late 20s, confident, glamorous, non-nude, sexy Pattaya/Soi Six bar hostess styling without explicit sexual content.
Character personality: electric, playful, fast-moving door promoter. Long straight black hair in a high ponytail, warm tan skin, silver hoop earrings, glossy teal crop top, fitted black mini skirt, ankle boots, small wrist bracelets. No red hair, no redhead traits.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, labels, or lighting variation. Do not use #00ff00 anywhere in the character.
Style/medium: high-detail hand-painted 2D arcade fighting-game sprite art, semi-realistic anatomy, crisp silhouette, neon nightlife rim lighting painted only on the character, readable at mobile scale, higher definition than a normal 256px frame while still clearly sprite-sheet art.
Composition/framing: one sprite-sheet contact sheet with three horizontal rows and clear equal cell spacing. Character faces right in every frame, full body visible in every cell, bottom-center foot contact aligned across all cells, consistent scale and anchor. Row 1: exactly 12 run frames, energetic forward run with hair and arms moving naturally. Row 2: exactly 10 walk frames, confident runway-like street walk. Row 3: exactly 8 flirt/wave idle/callout frames, playful beckoning wave and shoulder turn. Leave unused cells empty #00ff00 only if needed to preserve row width.
Animation requirements: each frame is a distinct pose in a believable loop with natural hip, shoulder, arm, hair, and leg motion. Avoid repeated stills, wobble-only animation, squash/stretch, body warping, costume changes, face changes, scale drift, or sliding feet.
Constraints: one character only, no text, no numbers, no UI, no watermark, no nudity, no explicit sexual act, no see-through clothing, no extra characters, no props, no background objects, no cast shadows. Transparent-ready chroma-key edges with generous padding.
```

### Kanda

```text
Use case: stylized-concept
Asset type: high-definition source sprite sheet for a 2D arcade fighting game ambient NPC, to be chopped into transparent 256x256 runtime frames.
Primary request: Create a single clean sprite-sheet image for one adult Thai/Asian woman nightlife NPC named Kanda. She is clearly an adult in her early 30s, confident, glamorous, non-nude, sexy Pattaya/Soi Six bar hostess styling without explicit sexual content.
Character personality: cool VIP lounge queen, poised and teasing, controlled elegant motion. Sleek shoulder-length jet-black bob, warm medium skin, gold earrings, black satin mini dress with gold trim, thin belt, strappy heels, subtle arm tattoo. No red hair, no redhead traits.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, labels, or lighting variation. Do not use #00ff00 anywhere in the character.
Style/medium: high-detail hand-painted 2D arcade fighting-game sprite art, semi-realistic anatomy, crisp silhouette, neon nightlife rim lighting painted only on the character, readable at mobile scale, higher definition than a normal 256px frame while still clearly sprite-sheet art.
Composition/framing: one sprite-sheet contact sheet with three horizontal rows and clear equal cell spacing. Character faces right in every frame, full body visible in every cell, bottom-center foot contact aligned across all cells, consistent scale and anchor. Row 1: exactly 12 run frames, elegant heel run with compact arms, controlled hair motion, urgent but graceful. Row 2: exactly 10 walk frames, slow confident VIP walk with one hand near hip. Row 3: exactly 8 flirt/wave idle/callout frames, slow wrist wave, chin tilt, beckoning gesture, composed smile. Leave unused cells empty #00ff00 only if needed to preserve row width.
Animation requirements: each frame is a distinct pose in a believable loop with natural hip, shoulder, arm, hair, and leg motion. Avoid repeated stills, wobble-only animation, squash/stretch, body warping, costume changes, face changes, scale drift, or sliding feet.
Constraints: one character only, no text, no numbers, no UI, no watermark, no nudity, no explicit sexual act, no see-through clothing, no extra characters, no props, no background objects, no cast shadows. Transparent-ready chroma-key edges with generous padding.
```

### Dao

```text
Use case: stylized-concept
Asset type: high-definition source sprite sheet for a 2D arcade fighting game ambient NPC, to be chopped into transparent 256x256 runtime frames.
Primary request: Create a single clean sprite-sheet image for one adult Thai/Asian woman nightlife NPC named Dao. She is clearly an adult in her late 20s, confident, glamorous, non-nude, sexy Pattaya/Soi Six bar hostess styling without explicit sexual content.
Character personality: sporty scooter-street promoter, cheeky and athletic, bouncy quick movement. Long dark brown hair tied under a black open-face helmet pushed back on her head, tan skin, cropped hot-pink moto jacket over a black fitted club top, high-waisted denim shorts, knee-high socks, white sneakers. No red hair, no redhead traits.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, labels, or lighting variation. Do not use #00ff00 anywhere in the character.
Style/medium: high-detail hand-painted 2D arcade fighting-game sprite art, semi-realistic anatomy, crisp silhouette, neon nightlife rim lighting painted only on the character, readable at mobile scale, higher definition than a normal 256px frame while still clearly sprite-sheet art.
Composition/framing: one sprite-sheet contact sheet with three horizontal rows and clear equal cell spacing. Character faces right in every frame, full body visible in every cell, bottom-center foot contact aligned across all cells, consistent scale and anchor. Row 1: exactly 12 run frames, athletic sprint with high knees, ponytail/helmet strap bounce, arms pumping. Row 2: exactly 10 walk frames, casual street strut with sporty bounce. Row 3: exactly 8 flirt/wave idle/callout frames, bright two-finger wave, playful lean forward, calling someone over. Leave unused cells empty #00ff00 only if needed to preserve row width.
Animation requirements: each frame is a distinct pose in a believable loop with natural hip, shoulder, arm, hair, and leg motion. Avoid repeated stills, wobble-only animation, squash/stretch, body warping, costume changes, face changes, scale drift, or sliding feet.
Constraints: one character only, no text, no numbers, no UI, no watermark, no nudity, no explicit sexual act, no see-through clothing, no extra characters, no props, no background objects, no cast shadows. Transparent-ready chroma-key edges with generous padding.
```

### Ploy

```text
Use case: stylized-concept
Asset type: high-definition source sprite sheet for a 2D arcade fighting game ambient NPC, to be chopped into transparent 256x256 runtime frames.
Primary request: Create a single clean sprite-sheet image for one adult Thai/Asian woman nightlife NPC named Ploy. She is clearly an adult in her late 20s, confident, glamorous, non-nude, sexy Pattaya/Soi Six bar hostess styling without explicit sexual content.
Character personality: sharp-tongued street dancer and callout girl, bold, rhythmic, teasing. Short black asymmetrical hair, warm tan skin, smoky eye makeup, metallic gold sleeveless club top, black fitted shorts over opaque tights, chunky platform boots, fingerless gloves, small choker. No red hair, no redhead traits.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, labels, or lighting variation. Do not use #00ff00 anywhere in the character.
Style/medium: high-detail hand-painted 2D arcade fighting-game sprite art, semi-realistic anatomy, crisp silhouette, neon nightlife rim lighting painted only on the character, readable at mobile scale, higher definition than a normal 256px frame while still clearly sprite-sheet art.
Composition/framing: one sprite-sheet contact sheet with three horizontal rows and clear equal cell spacing. Character faces right in every frame, full body visible in every cell, bottom-center foot contact aligned across all cells, consistent scale and anchor. Row 1: exactly 12 run frames, dancer-like run with rhythmic arm swings, strong knee lift, short hair motion. Row 2: exactly 10 walk frames, swaggering dance-step walk with hip rhythm and boot weight. Row 3: exactly 8 flirt/wave idle/callout frames, teasing finger wave, hand-to-mouth callout, quick shoulder pop. Leave unused cells empty #00ff00 only if needed to preserve row width.
Animation requirements: each frame is a distinct pose in a believable loop with natural hip, shoulder, arm, hair, and leg motion. Avoid repeated stills, wobble-only animation, squash/stretch, body warping, costume changes, face changes, scale drift, or sliding feet.
Constraints: one character only, no text, no numbers, no UI, no watermark, no nudity, no explicit sexual act, no see-through clothing, no extra characters, no props, no background objects, no cast shadows. Transparent-ready chroma-key edges with generous padding.
```
